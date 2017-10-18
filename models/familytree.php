<?php
/*
 * @Author: Slash Web Design
 */

class FamilyTree extends Core
{
	public		 $template = 'template-full.html';
	public   $loadExternal = array();
	public        $loadCSS = array('slider.css', 'datepicker.css', 'fileuploader.css');
	public         $loadJS = array('facebook.js', 'slider.js', 'datepicker.js', 'fileuploader.js', 'pan.js', 'tree-helper.js', 'tree.js');
	public		$hasAccess = false;
	protected $accessLevel = 3;
	protected $relatives = array();
	
	function __construct()
	{
		parent::__construct();

		$this->hasAccess = $this->canAccess($this->accessLevel);
	}
	
	public function invite(&$ld)
	{
		// update person's email field
		$this->db->update("person", array('email' => $ld['email']), "person_id = {$ld['id']}");
		
		// get person's details
		$res = $this->db->run("SELECT fname, lname FROM person WHERE person_id = {$ld['id']}");
		$person = $res[0];
		
		$r = $this->helper->sendMailTemplate(
				'user.invitation',
				array('[NAME]', '[ME]'),
				array($person['fname'], $this->user->fname),
				array('name' => $person['fname'] . ' ' . $person['lname'], 'email' => $ld['email'])
			);
		
		$this->helper->respond(array(
			'success'	=>	true,
			'mail'		=>	$r,
			'message'	=>	'Invitation to ' . $person['fname'] . ' ' . $person['lname'] . ' has been sent'
		));
	}
	
	public function delete(&$ld)
	{
		// delete person and all relationship links
		$this->db->run("DELETE FROM person WHERE person_id = {$ld['person_id']}");
		$this->db->run("DELETE FROM relationship WHERE a = {$ld['person_id']} OR b = {$ld['person_id']}");
		
		// delete profile image
		@unlink("uploads/person/{$ld['person_id']}.jpg");

		$this->helper->respond(array(
			'status'	=>	true,
			'tree'		=>	$this->__getTree($ld)
		));
	}
	
	public function save(&$ld)
	{
		$ld['details']['member_id'] = $this->user->id;
		if ($ld['details']['gender'] == 'm')
		{
			unset($ld['details']['maiden']);
			unset($ld['details']['married']);
		}
		else
		{
			unset($ld['details']['lname']);	
		}
		if ($ld['details']['dob'] !== '')
		{
			$myDateTime = DateTime::createFromFormat('m/d/Y', $ld['details']['dob']);
			if ($myDateTime != false)
				$dobStr = $myDateTime->format('Y-m-d');
			else
				$dobStr = '';
			$ld['details']['dob'] = $dobStr;
			// $ld['details']['dob'] = strtotime($ld['details']['dob']);	
		}
		if ($ld['details']['dod'] !== ''){
			$myDateTime = DateTime::createFromFormat('m/d/Y', $ld['details']['dod']);
			if ($myDateTime != false)
				$dodStr = $myDateTime->format('Y-m-d');
			else
				$dodStr = '';
			$ld['details']['dod'] = $dodStr;
			// $ld['details']['dod'] = strtotime($ld['details']['dod']);
		}
		if ($ld['details']['relationship'] === 'mother' || $ld['details']['relationship'] === 'father')
		{
			$parent = $this->__getRelation($ld['relation_id'], $ld['details']['relationship']);
			
			if ($parent !== false)
			{
				$ld['person_id'] = $parent[0];
				$ld['details']['placeholder'] = 0;
			}
		}
		$mine = false;

		if ($ld['person_id'] === '0')
		{
			$this->db->insert("person", $ld['details']);
			$ld['person_id'] = $this->db->lastInsertId();
			
			$this->__createRelationship($ld['relation_id'], $ld['person_id'], $ld['details']['relationship'], $ld);
		}
		else
		{
			unset($ld['details']['gender']);
			$this->db->update("person", $ld['details'], "person_id = {$ld['person_id']}");

			if ($ld['person_id'] == $this->user->personId)
			{
				$mine = true;
				$member = array();
				$member["fname"] = $ld['details']["fname"];
				$member["lname"] = $ld['details']["lname"];
				$member["city"] = $ld['details']["current_city"];
				$member["dob"] = $ld['details']["dob"];
				$member["pob"] = $ld['details']["pob"];
				$this->db->update("member", $member, "member_id = {$ld['details']['member_id']}");
			}
		}
		
		// process profile image
		if ($ld['details']['image'] !== '')
		{
			//require_once 'classes/class.image.php';
			
			$r = new Resize($ld['details']['image']);
			$r->resizeImage(300, 300, 'crop');
			$r->saveImage("uploads/person/{$ld['person_id']}.jpg", 75);
			
			unset($r);
			@unlink($ld['details']['image']);
		}
		
		$this->helper->respond(array(
			'status'	=>	true,
			'mine'		=> $mine,
			'tree'		=>	$this->__getTree($ld)
		));
	}
	
	protected function __createRelationship($a, $b, $r, $ld)
	{
		if ($r === 'partner') $r = ($ld['details']['gender'] === 'm') ? 'partnerM' : 'partnerF';
		if ($r === 'ex-partner') $r = ($ld['details']['gender'] === 'm') ? 'ex-partnerM' : 'ex-partnerF';
		
		$normal = array('mother', 'father', 'son', 'daughter', 'brother', 'sister');
		
		$gender = $this->__getGender($a);
		
		$mother = $this->__getRelation($a, 'mother');
		$father = $this->__getRelation($a, 'father');
		$sisters = $this->__getRelation($a, 'sister');
		$brothers = $this->__getRelation($a, 'brother');
		
		if (in_array($r, $normal)) $this->__addRelation($a, $b, $r);
		
		switch ($r)
		{
			case 'mother':
				$relationship = ($this->__getGender($a) === 'm') ? 'son' : 'daughter';
				$this->__addRelation($b, $a, $relationship);
				
				// check for father
				if ($father === false)
				{
					// set up father as placeholder
					$this->db->insert("person", array('member_id' => $this->user->id, 'placeholder' => 1, 'gender' => 'm'));
					$father = $this->db->lastInsertId();
					
					// connect father and mother
					$this->__addRelation($father, $b, 'partnerF', 'wife');
					$this->__addRelation($b, $father, 'partnerM', 'husband');
					
					// connect father to person
					$this->__addRelation($father, $a, $relationship);
					$this->__addRelation($a, $father, 'father');
				}
				else
				{
					$father = $father[0];
					
					// connect father with mother
					$this->__addRelation($father, $b, 'partnerF', 'wife');
					$this->__addRelation($b, $father, 'partnerM', 'husband');
				}
				
				break;

			case 'father':
				$relationship = ($this->__getGender($a) === 'm') ? 'son' : 'daughter';
				$this->__addRelation($b, $a, $relationship);
				
				// check for mother				
				if ($mother === false)
				{
					// set up mother as placeholder
					$this->db->insert("person", array('member_id' => $this->user->id, 'placeholder' => 1, 'gender' => 'f'));
					$mother = $this->db->lastInsertId();
					
					// connect mother and mother
					$this->__addRelation($mother, $b, 'partnerM', 'husband');
					$this->__addRelation($b, $mother, 'partnerF', 'wife');
					
					// connect mother to person
					$this->__addRelation($mother, $a, $relationship);
					$this->__addRelation($a, $mother, 'mother');
				}
				else
				{
					$mother = $mother[0];
					
					// connect mother with mother
					$this->__addRelation($mother, $b, 'partnerM', 'husband');
					$this->__addRelation($b, $mother, 'partnerF', 'wife');
				}
				
				break;

			case 'brother':
				$this->__addRelation($b, $a, ($gender === 'f') ? 'sister' : 'brother');
				
				if ($mother !== false) 
				{
					$this->__addRelation($b, $mother[0], 'mother');
					$this->__addRelation($mother[0], $b, 'son');
				}
				if ($father !== false)
				{
					$this->__addRelation($b, $father[0], 'father');
					$this->__addRelation($father[0], $b, 'son');
				}
				if ($sisters !== false)
				{
					foreach ($sisters as $ss)
					{
						$this->__addRelation($b, $ss, 'sister');
						$this->__addRelation($ss, $b, 'brother');
					}
				}
				if ($brothers !== false)
				{
					foreach ($brothers as $bb)
					{
						$this->__addRelation($b, $bb, 'brother');
						$this->__addRelation($bb, $b, 'brother');
					}
				}
				break;

			case 'sister':
				$this->__addRelation($b, $a, ($gender === 'm') ? 'brother' : 'sister');
				
				if ($mother !== false) 
				{
					$this->__addRelation($b, $mother[0], 'mother');
					$this->__addRelation($mother[0], $b, 'daughter');
				}
				if ($father !== false)
				{
					$this->__addRelation($b, $father[0], 'father');
					$this->__addRelation($father[0], $b, 'daughter');
				}
				if ($sisters !== false)
				{
					foreach ($sisters as $ss)
					{
						$this->__addRelation($b, $ss, 'sister');
						$this->__addRelation($ss, $b, 'sister');
					}
				}
				if ($brothers !== false)
				{
					foreach ($brothers as $bb)
					{
						$this->__addRelation($b, $bb, 'brother');
						$this->__addRelation($bb, $b, 'sister');
					}
				}
				break;

			case 'son':
				$sons = false; $daughters = false;
				if ($ld['father_id'] !== '')
				{
					$sons = $this->__getRelation($a, $ld['father_id'], 'son');
					$daughters = $this->__getRelation($a, $ld['father_id'], 'daughter');

					$this->__addRelation($b, $ld['father_id'], 'father');
					$this->__addRelation($ld['father_id'], $b, 'son');
					$this->__addRelation($b, $a, 'mother');
				}
				if ($ld['mother_id'] !== '')
				{
					$sons = $this->__getRelation($a, $ld['mother_id'], 'son');
					$daughters = $this->__getRelation($a, $ld['mother_id'], 'daughter');

					$this->__addRelation($b, $ld['mother_id'], 'mother');
					$this->__addRelation($ld['mother_id'], $b, 'son');
					$this->__addRelation($b, $a, 'father');
				}

				if ($sons !== false)
				{
					foreach ($sons as $ss)
					{
						$this->__addRelation($b, $ss, 'brother');
						$this->__addRelation($ss, $b, 'brother');
					}
				}
				if ($daughters !== false)
				{
					foreach ($daughters as $dd)
					{
						$this->__addRelation($b, $dd, 'sister');
						$this->__addRelation($dd, $b, 'brother');
					}
				}
				break;

			case 'daughter':
				$sons = false; $daughters = false;
				if ($ld['father_id'] !== '')
				{
					$sons = $this->__getRelation($a, $ld['father_id'], 'son');
					$daughters = $this->__getRelation($a, $ld['father_id'], 'daughter');

					$this->__addRelation($b, $ld['father_id'], 'father');
					$this->__addRelation($ld['father_id'], $b, 'daughter');
					$this->__addRelation($b, $a, 'mother');
				}
				if ($ld['mother_id'] !== '')
				{
					$sons = $this->__getRelation($a, $ld['mother_id'], 'son');
					$daughters = $this->__getRelation($a, $ld['mother_id'], 'daughter');

					$this->__addRelation($b, $ld['mother_id'], 'mother');
					$this->__addRelation($ld['mother_id'], $b, 'daughter');
					$this->__addRelation($b, $a, 'father');
				}

				if ($sons !== false)
				{
					foreach ($sons as $ss)
					{
						$this->__addRelation($b, $ss, 'brother');
						$this->__addRelation($ss, $b, 'sister');
					}
				}
				if ($daughters !== false)
				{
					foreach ($daughters as $dd)
					{
						$this->__addRelation($b, $dd, 'sister');
						$this->__addRelation($dd, $b, 'sister');
					}
				}
				break;

			case 'partnerF':
				$this->__addRelation($a, $b, 'partnerF', 'partner');
				$this->__addRelation($b, $a, 'partnerM', 'partner');
				break;

			case 'partnerM':
				$this->__addRelation($a, $b, 'partnerM', 'partner');
				$this->__addRelation($b, $a, 'partnerF', 'partner');
				break;

			case 'ex-partnerF':
				$this->__addRelation($a, $b, 'partnerF', 'ex-partner');
				$this->__addRelation($b, $a, 'partnerM', 'ex-partner');
				break;

			case 'ex-partnerM':
				$this->__addRelation($a, $b, 'partnerM', 'ex-partner');
				$this->__addRelation($b, $a, 'partnerF',  'ex-partner');
				break;

			case 'wife':
				$this->__addRelation($a, $b, 'partnerF', 'wife');
				$this->__addRelation($b, $a, 'partnerM', 'husband');
				break;

			case 'husband':
				$this->__addRelation($a, $b, 'partnerM', 'husband');
				$this->__addRelation($b, $a, 'partnerF', 'wife');
				break;

			case 'ex-wife':
				$this->__addRelation($a, $b, 'partnerF', 'ex-wife');
				$this->__addRelation($b, $a, 'partnerM', 'ex-husband');
				break;

			case 'ex-husband':
				$this->__addRelation($a, $b, 'partnerM', 'ex-husband');
				$this->__addRelation($b, $a, 'partnerF', 'ex-wife');
				break;
		}
	}
	
	protected function __addRelation($a, $b, $r, $description = '')
	{
		$this->db->insert("relationship", array('a' => $a, 'b' => $b, 'r' => $r, 'description' => $description, 'member_id' => $this->user->id));
	}
	
	protected function __getRelation($personId, $relation)
	{
		$relatives = array();
		$res = $this->db->run("SELECT b FROM relationship WHERE a = {$personId} AND r = '{$relation}'");
		foreach ($res as $r)
		{
			$relatives[] = $r['b'];
		}
		
		return (count($res) === 0) ? false : $relatives;
	}
	protected function __getDetail($id)
	{
		$res = $this->db->run("SELECT * FROM person WHERE person_id = {$id}");
		return $res[0];
	}
	protected function __findFather($id)
	{
		$res = $this->db->run("SELECT b FROM relationship WHERE a = {$id} AND r='father'");
		if (count($res) > 0)
			return $res[0]["b"];
		else return "";
	}
	protected function __findMother($id)
	{
		$res = $this->db->run("SELECT b FROM relationship WHERE a = {$id} AND r='mother'");
		if (count($res) > 0)
			return $res[0]["b"];
		else return "";
	}
	protected function __findWife($id)
	{
		$res = $this->db->run("SELECT b FROM relationship WHERE a = {$id} AND r='partnerF' and description='wife'");
		if (count($res) > 0)
			return $res[0]["b"];
		else return "";
	}
	protected function __findHusband($id)
	{
		$res = $this->db->run("SELECT b FROM relationship WHERE a = {$id} AND r='partnerM' and description='husband'");
		if (count($res) > 0)
			return $res[0]["b"];
		else return "";
	}
	protected function __getGender($id)
	{
		$res = $this->db->run("SELECT gender FROM person WHERE person_id = {$id}");
		return $res[0]['gender'];
	}
	
	protected function __getChildren($x, $y, $relation)
	{
		$relatives = array();
		$temp = array();
		
		$res1 = $this->db->run("SELECT b FROM relationship WHERE a = {$x} AND r = '{$relation}'");
		$res2 = $this->db->run("SELECT b FROM relationship WHERE a = {$y} AND r = '{$relation}'");
		
		foreach ($res1 as $r)
		{
			$temp[] = $r['b'];
		}
		foreach ($res2 as $r)
		{
			if (in_array($r['b'], $temp)) $relatives[] = $r['b'];
		}
		
		return (count($res) === 0) ? false : $relatives;
	}
	
	public function fetchTree(&$ld)
	{
		$this->helper->respond(array(
			'success'	=>	true,
			'tree'		=>	$this->__getTree($ld)
		));
	}
	
	protected function __getTree(&$ld)
	{
		global $site_url;
		
		// fetch tree for current user or provided user
		$id = isset($ld['id']) ? $ld['id'] : $this->user->personId;
			
		$data = array();
		$this->discoverRelatives($id, $data);
		$data = array(
			'persons'		=>	array(),
			'relationships'	=>	$data
		);
		$was = array();
		foreach ($data['relationships'] as $r)
		{
			if (!in_array($r['a'], $was))
			{
				$was[] = $r['a']; 
				$data['persons'][] = $this->getPersonDetails($r['a'], $data['relationships']);
			}
		}

		if (count($was) === 0) // has no relationships, add itself
		{
			$data['persons'][] = $this->getPersonDetails($id, false);
		}
		
		return array(
			'persons'		=>	$data['persons'],
			'relationships'	=>	$data['relationships']
		);
	}
	
	protected function canEdit($person, $rel)
	{
		$editable = array('mother', 'father', 'son', 'daughter', 'partnerM', 'partnerF', 'sister', 'brother');
		$permissions = array(
			'canEdit'	=>	false,
			'reason'	=>	''
		);
		
		if ((int) $person['member_id'] === $this->user->id)
		{
			$permissions['canEdit'] = true;
			$permissions['reason'] = 'owns node';
			return $permissions;
		}
		
		// check for first tier relatives
		foreach ($rel as $r)
		{
			if (($r['a'] === $this->user->personId) && ($r['b'] === $person['id']))
			{
				$permissions['canEdit'] = true;
				$permissions['reason'] = 'first tier relative';
				return $permissions;
			}
		}
		
		// check for second tier relatives
		foreach ($rel as $r)
		{
			if (($r['a'] !== $this->user->personId) && ($r['b'] === $person['id']))
			{
				$res = $this->db->run("SELECT relationship_id FROM relationship WHERE a = {$r['a']} AND b = {$this->user->personId}");
				if (count($res) > 0)
				{
					$permissions['canEdit'] = true;
					$permissions['reason'] = 'second tier relative';
					return $permissions;
				}
			}
		}
		
		return $permissions;
	}
	
	protected function discoverRelatives($id, &$data)
	{
		if (!in_array($id, $this->relatives)) // run discovery for each relative once
		{
			$this->relatives[] = $id;
			
			// get immediate relatives
			$res = $this->db->run("SELECT a, b, r, description FROM relationship WHERE a = {$id}");
			foreach ($res as $r)
			{
				$data[] = $r;
				$this->discoverRelatives($r['b'], $data);
			}
		}
	}
	
	protected function getPersonDetails($id, $relationships)
	{
		$res = $this->db->run("SELECT person.person_id AS id, person.member_id, TRIM(CONCAT(person.fname, ' ', person.lname)) AS name, person.fname, person.lname, person.mname, person.married, person.maiden, person.gender, person.me, person.dob, person.dod, person.pob, person.email, person.placeholder, person.alive, person.current_city, member.city FROM person LEFT JOIN member ON member.member_id=person.member_id WHERE person_id = {$id}");
		$person = $res[0];
		$rnd = rand(111, 999);
		$permission = $this->canEdit($person, $relationships);
		$person['canEdit'] = $permission['canEdit'];
		$person['permissions'] = $permission;

		$dobStr = DateTime::createFromFormat("Y-m-d", $person['dob']);
		if ($dobStr!=false && $person['dob']!='0000-00-00'){
			$person['dob'] = $dobStr->format("m/d/Y");
			$person['dobStr'] = $dobStr->format("Y");
		}
		else
			$person['dobStr'] = '';

		$dodStr = DateTime::createFromFormat("Y-m-d", $person['dod']);
		if ($dodStr!=false && $person['dod']!='0000-00-00'){
			$person['dod'] = $dodStr->format("m/d/Y");
			$person['dodStr'] = $dodStr->format("Y");
		}
		else
			$person['dodStr'] = '';

		if ($person['gender'] == 'f')
			$person['name'] = $person['fname'] . ' ' . $person['maiden'];
		// if ($id==58)
		// 	var_dump($person['dodStr']);

		// $person['dobStr'] = ($person['dob'] !== '0') ? date('Y', $person['dob']) : '';
		// $person['dodStr'] = ($person['dod'] !== '0') ? date('Y', $person['dod']) : '';
		$person['image'] = file_exists("uploads/person/{$person['id']}.jpg") ? "uploads/person/{$person['id']}.jpg?v={$rnd}" : "assets/img/profile.na.png";
		
		return $person;
	}

	public function fetch()
	{
		$p = new Parser("family-tree.html");
		return $p->fetch();
	}
	public function possibleFamily(&$ld)
	{
		$id = $ld['id'];
		$gender = $ld['gender'];
		$name = $ld['name'];
		$q1 = '%' . strtolower($name) . '%';		// name
		$where_clause = " 
				(LOWER(person.fname) LIKE '{$q1}' OR 
				LOWER(person.mname) LIKE '{$q1}' OR
				LOWER(person.lname) LIKE '{$q1}' OR
				LOWER(person.maiden) LIKE '{$q1}' OR
				LOWER(person.married) LIKE '{$q1}' OR
				LOWER(person.nickname) LIKE '{$q1}' OR
				LOWER(CONCAT(person.fname, ' ', person.lname)) LIKE '{$q1}' OR
				LOWER(CONCAT(person.fname, ' ', person.mname, ' ', person.lname)) LIKE '{$q1}') ";
		$my_direct_relatives_persons = $this->db->run("SELECT person.person_id,person.fname,person.lname,person.gender,person.current_city,person.dob, relationship.* FROM person LEFT JOIN relationship ON person.person_id=relationship.a where (person.fname!='' OR person.lname!='') and person.me='1' and relationship.a='$id' ORDER BY person.person_id ASC");
		$my_relative_list = array_flip(["husband","wife","father","mother","son","daughter","brother","sister"]);
		foreach($my_direct_relatives_persons as $each)
		{
			if ($each['r'] == 'partnerM' && $each['description'] == 'husband')
				unset($my_relative_list['husband']);
			else if ($each['r'] == 'partnerF' && $each['description'] == 'wife')
				unset($my_relative_list['wife']);
			else if ($each['r'] == 'father' || $each['r'] == 'mother')
				unset($my_relative_list[ $each['r'] ]);
		}
		$res = $this->db->run("SELECT person.person_id,person.fname,person.lname,person.gender,person.current_city,person.dob, relationship.* FROM person LEFT JOIN relationship ON person.person_id=relationship.a where (person.fname!='' OR person.lname!='') and person.me='1' and ({$where_clause}) ORDER BY person.person_id ASC");
		$mytree = $this->__getTree($ld);
		$count = count($res);
		$result = array();
		// $result = $mytree;
		for ($i=0;$i<$count;$i++)
		{
			$found = false;
			if ($res[$i]['person_id'] == $id) continue;
			for ($j = 0; $j < count($mytree); $j++)
			{
				if (isset($mytree['persons'][$j]['id']) && $mytree['persons'][$j]['id'] == $res[$i]['person_id'])
				{
					$found = true;
				}
			}
			if ($found == true) continue;
			$relative_list = array_flip(["husband","wife","father","mother","son","daughter","brother","sister"]);

			if ($res[$i]['gender'] == 'm'){
				unset($relative_list['husband']);
				// unset($relative_list['sister']);
			}
			if ($res[$i]['gender'] == 'f'){
				unset($relative_list['wife']);
				// unset($relative_list['brother']);
			}
			if ($gender == 'm')
			{
				unset($relative_list['wife']);
				unset($relative_list['mother']);
				unset($relative_list['daughter']);
				// unset($relative_list['sister']);
			}
			else{
				unset($relative_list['husband']);
				unset($relative_list['father']);
				unset($relative_list['son']);
				// unset($relative_list['brother']);	
			}
			
			$son_count = 0; $dau_count = 0;
			for ($j=$i;$j<$count;$j++)
			{
				if ($res[$j]['person_id'] != $res[$i]['person_id'])
					break;
				if ($res[$j]['r'] == 'partnerF' && $res[$j]['description'] == 'wife')
					unset($relative_list['wife']);
				if ($res[$j]['r'] == 'partnerM' && $res[$j]['description'] == 'husband')
					unset($relative_list['husband']);

				if ($res[$j]['r'] == 'father' || $res[$j]['r'] == 'mother')
					unset($relative_list[ $res[$j]['r'] ]);
				else if ($res[$j]['r'] == 'son')
					$son_count ++;
				else if ($res[$j]['r'] == 'daughter')
					$dau_count ++;
			}

			if (count($relative_list) > 0)
			{
				$temp = array();
				$temp['id'] = $res[$i]["person_id"];
				$temp['fname'] = $res[$i]["fname"];
				$temp['lname'] = $res[$i]["lname"];
				$temp['current_city'] = $res[$i]["current_city"];

				$myDateTime = DateTime::createFromFormat('Y-m-d', $res[$i]["dob"]);
				if ($myDateTime != false)
					$dobStr = $myDateTime->format('m/d/Y');
				else
					$dobStr = '';
				$temp['dob'] = $dobStr;
				if (strlen($temp['fname']) != 0)
					$temp['name'] = $temp['fname'] . " " . $temp['lname'];
				else
					$temp['name'] = $temp['lname'];
				$temp['lower_name'] = strtolower($temp['name']);
				$temp['gender'] = $res[$i]["gender"];

				$rnd = rand(111, 999);
				$temp['image'] = file_exists("uploads/person/{$res[$i]["person_id"]}.jpg") ? "uploads/person/{$res[$i]["person_id"]}.jpg?v={$rnd}" : "assets/img/profile.na.png";

				$temp['relative'] = '';
				if (isset($my_relative_list['wife']) && isset($relative_list['husband']))
					$temp['relative'] .= 'wife,';

				if (isset($my_relative_list['husband']) && isset($relative_list['wife']))
					$temp['relative'] .= 'husband,';

				if (isset($my_relative_list['father']) && (isset($relative_list['son']) || isset($relative_list['daughter'])) && $res[$i]["gender"] == 'm')
					$temp['relative'] .= 'father,';

				if (isset($my_relative_list['mother']) && (isset($relative_list['son']) || isset($relative_list['daughter'])) && $res[$i]["gender"] == 'f')
					$temp['relative'] .= 'mother,';

				if (isset($my_relative_list['son']) && $gender == 'm' && !isset($my_relative_list['wife']) && $res[$i]["gender"] == 'm' && isset($relative_list['father']))
					$temp['relative'] .= 'son,';

				if (isset($my_relative_list['son']) && $gender == 'f' && !isset($my_relative_list['husband']) && $res[$i]["gender"] == 'm' && isset($relative_list['mother']))
					$temp['relative'] .= 'son,';

				if (isset($my_relative_list['daughter']) && $gender == 'm' && !isset($my_relative_list['wife']) && $res[$i]["gender"] == 'f' && isset($relative_list['father']))
					$temp['relative'] .= 'daughter,';

				if (isset($my_relative_list['daughter']) && $gender == 'f' && !isset($my_relative_list['husband']) && $res[$i]["gender"] == 'f' && isset($relative_list['mother']))
					$temp['relative'] .= 'daughter,';

				if ((isset($my_relative_list['father']) || isset($my_relative_list['mother'])) ^
					(isset($relative_list['father']) || isset($relative_list['mother'])))
				{
					if (isset($my_relative_list['brother']) && isset($relative_list['brother']) && $gender == 'm' && $res[$i]["gender"] == 'm')
						$temp['relative'] .= 'brother,';

					if (isset($my_relative_list['sister']) && isset($relative_list['brother']) && $gender == 'm' && $res[$i]["gender"] == 'f')
						$temp['relative'] .= 'brother,';

					if (isset($my_relative_list['sister']) && isset($relative_list['sister']) && $gender == 'f' && $res[$i]["gender"] == 'f')
						$temp['relative'] .= 'sister,';	

					if (isset($my_relative_list['brother']) && isset($relative_list['sister']) && $gender == 'f' && $res[$i]["gender"] == 'm')
						$temp['relative'] .= 'sister,';
				}

				if (strlen($temp['relative']) > 1){
					$temp['relative'] = rtrim($temp['relative'], ",");
					$result[] = $temp;
				}
			}
			$i = $j-1;
		}

		function sortByOrder($a, $b) {
	    	return strcmp($a['lower_name'],$b['lower_name']);
		}
		usort($result, 'sortByOrder');
		$this->helper->respond(array(
			'status'	=>	true,
			'family'	=>	$result
		));
	}
	public function addrelative(&$ld)
	{
		// delete person and all relationship links
		$relative1 = $ld['q']['relative'];
		$id1 = $ld['q']['myid'];
		$id2 = $ld['q']['relativeid'];

		$detail = array();
		$detail["relationId"] = $id1;
		$detail["person_id"] = $id2;
		$detail["father_id"] = "";
		$detail["mother_id"] = "";
		if ($ld['q']['mygender'] == 'm')
			$detail["mother_id"] = $this->__findWife($id1);
		else
			$detail["mother_id"] = $this->__findHusband($id1);
		$detail["detail"] = $this->__getDetail($id2);
		if ($relative1 == "sister" || $relative1 == "brother")
		{
			$mfather1 = $this->__findFather($id1);
			if ($mfather1 == "")
			{
				$rel_arr = array("brother" => "sister", "sister" => "brother");

				$detail['relationId'] = $id2;
				$detail['person_id'] = $id1;
				$detail["father_id"] = "";
				$detail["mother_id"] = "";
				if ($ld['q']['gender'] == 'm')
					$detail["mother_id"] = $this->__findWife($id2);
				else
					$detail["mother_id"] = $this->__findHusband($id2);
				$detail["detail"] = $this->__getDetail($id1);
				if ($ld['q']['mygender'] != $ld['q']['gender'])
					$relative1 = $rel_arr[$relative1];
			}
		}

		$this->__createRelationship($detail['relationId'], $detail['person_id'], $relative1, $detail);
		$this->helper->respond(array(
			'status'	=>	true,
			'tree'		=>	$this->__getTree($ld)
		));
	}
}
?>