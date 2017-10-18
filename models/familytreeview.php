<?php
/*
 * @Author: Slash Web Design
 */

class FamilyTreeView extends Core
{
	public		 $template = 'template-full.html';
	public   $loadExternal = array('https://checkout.stripe.com/checkout.js');
	public        $loadCSS = array('slider.css', 'tree.css');
	public         $loadJS = array('slider.js', 'pan.js', 'tree-helper.js', 'tree-view.js', 'facebook.js', 'client.js');
	public		$hasAccess = false;
	protected $accessLevel = 4;
	protected $relatives = array();
	
	function __construct()
	{
		parent::__construct();

		$this->hasAccess = $this->canAccess($this->accessLevel);
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
				$res = $this->db->run("SELECT person_id AS id, member_id, TRIM(CONCAT(fname, ' ', lname)) AS name, fname, lname, maiden, mname, gender, me, dob, dod, pob, email, placeholder, alive FROM person WHERE person_id = {$r['a']}");
				$person = $res[0];
				$rnd = rand(111, 999);

				$person['canEdit'] = false;


				$dobStr = DateTime::createFromFormat("Y-m-d", $person['dob']);
				if ($dobStr!=false && $person['dob']!='0000-00-00')
					$person['dobStr'] = $dobStr->format("Y");
				else
					$person['dobStr'] = '';

				$dodStr = DateTime::createFromFormat("Y-m-d", $person['dod']);
				if ($dodStr!=false && $person['dod']!='0000-00-00')
					$person['dodStr'] = $dodStr->format("Y");
				else
					$person['dodStr'] = '';


				if ($person['gender'] == 'f')
					$person['name'] = $person['fname'] . ' ' . $person['maiden'];
				// $person['dobStr'] = ($person['dob'] !== '0') ? date('Y', $person['dob']) : '';
				// $person['dodStr'] = ($person['dod'] !== '0') ? date('Y', $person['dod']) : '';
				$person['image'] = file_exists("uploads/person/{$person['id']}.jpg") ? "uploads/person/{$person['id']}.jpg?v={$rnd}" : "assets/img/profile.na.png";

				$data['persons'][] = $person;
			}
		}
		
		return array(
			'persons'		=>	$data['persons'],
			'relationships'	=>	$data['relationships']
		);
	}
	
	protected function discoverRelatives($id, &$data)
	{
		//$this->helper->p("discovered IDs");
		//$this->helper->p($this->relatives);
		
		if (!in_array($id, $this->relatives))
		{
			//$this->helper->p("starting discovery for {$id}");

			$this->relatives[] = $id;
			
			// get immediate relatives
			$res = $this->db->run("SELECT a, b, r, description FROM relationship WHERE a = {$id}");
			foreach ($res as $r)
			{
				$data[] = $r;
				$this->discoverRelatives($r['b'], $data);
			}
		}
		else
		{
			//$this->helper->p("aborting discovery for {$id}");
		}
		
		//$this->helper->p("discovered IDs");
		//$this->helper->p($this->relatives);		
	}

	public function fetch()
	{
		global $glob;
		
		$p = new Parser("family-tree-view.html");

		$p->parseValue(array(
			'ID'		=>	$glob['id'],
			//'SITE_URL'	=>	$site_url
		));
		
		return $p->fetch();
	}
}
?>