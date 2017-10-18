/* 
 * Tree module
 * ©SWD
 */

var tree = {
	
	time: {
		processing: 0,
		rendering: 0,
		total: 0
	},
	
	profileId: 0,
	
	pz: null,
	me: null,
	data: null,
	root: null,
	graph: null,
	calcLevel: function(personLevels, me_id)
	{
		while(personLevels[0] < this.data.persons.length)
		{
			for (var i = 0; i < this.data.relationships.length; i++)
			{
				var rel = this.data.relationships[i];
				if (personLevels[rel.b] != -9999 && personLevels[rel.a] == -9999)
				{
					if (rel.r === 'mother' || rel.r === 'father')
						personLevels[rel.a] = personLevels[rel.b] - 1;
					else if (rel.r === 'daughter' || rel.r === 'son')
						personLevels[rel.a] = personLevels[rel.b] + 1;
					else
						personLevels[rel.a] = personLevels[rel.b];
					personLevels[0] ++;
				}
			}
		}
	},
	findMaxId: function(){
		var max_id = -1;
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (max_id < parseInt(this.data.persons[i].id)) 
				max_id = parseInt(this.data.persons[i].id);
		}
		return max_id + 1;
	},
	createVirtual: function(gender = 'm'){
		var vPerson = {}, permissions = {};
		if (gender == undefined)
			gender = 'm';
		permissions["canEdit"] = true;
		permissions["reason"] = "owns node";
		vPerson["id"] = this.findMaxId() + "";
		vPerson["fname"] = "";
		vPerson["lname"] = "";
		if (gender == 'm')
			vPerson['placeholder'] = "0";
		else
			vPerson['placeholder'] = "1";
		vPerson["name"] = "VIRTUAL";
		vPerson['image'] = "";
		vPerson["dobStr"] = "VIRTUAL";
		vPerson["dodStr"] = "VIRTUAL";
		vPerson["email"] ="VIRTUAL";
		vPerson["current_city"] = "VIRTUAL";
		vPerson["pob"] = "VIRTUAL";
		vPerson["city"] = "";
		vPerson["dob"] = vPerson["dod"] = "";
		vPerson["gender"] = gender;
		vPerson["permissions"] = permissions;
		this.data.persons.push(vPerson);
		return this.data.persons.length - 1;
	},
	linkTwoPerson: function(id1, relative1, id2, relatvie2)
	{
		var obj1 = {}, obj2 = {};
		obj1["a"] = id1;
		obj1["b"] = id2;
		obj1["description"] = "VIRTUAL";
		obj1["r"] = relative1;
		this.data.relationships.push(obj1);

		obj2["b"] = id1;
		obj2["a"] = id2;
		obj2["description"] = "VIRTUAL";
		obj2["r"] = relatvie2;
		this.data.relationships.push(obj2);
	},
	haveRelative: function(id1, id2){
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			if (rel.a == id1 && rel.b == id2)
			{
				return true;
			}
		}
		return false
	},
	removeVirtualNodes: function(){
		var temp_person = [];
		for (var i = 0; i <=this.data.persons.length ; i++)
		{
			var person = this.data.persons[i];
			if (person != undefined)
			{
				if (person['email'] !== 'VIRTUAL' && person['name'] !== 'VIRTUAL')
				{
					temp_person.push(person);
				}
				if (person['email'] === 'VIRTUAL' && person['name'] === 'VIRTUAL')
				{
					for (var j = 0; j < this.data.relationships.length; j++)
					{
						var rel = this.data.relationships[j];
						if (rel == undefined) break;
						if (rel.a == person['id'] || rel.b == person['id'])
						{
							this.data.relationships.splice(j,1);
						}
					}
				}
			}
		}
		this.data.persons = temp_person;
	},
	render: function(){

		var 
			timeStart,
			timeMiddle,
			timeEnd;
		timeStart = new Date();
		if ($('.my-entire-family').attr('attr') == 'selected')
		{
			var temp_nodes = [], ids = [], levels = [];
			var personLevels = [], first_parent = true, max_id = -1;

			this.removeVirtualNodes();
			temp_nodes.push(this.findRoot());
			this.root = temp_nodes[0].node
			
			for (var i = 0; i < this.data.persons.length; i++)
			{
				personLevels[this.data.persons[i].id] = -9999;
			}
			personLevels[this.me.id] = 0;
			personLevels[0] = 1;	// calculated count;
			this.calcLevel(personLevels, this.me.id);

			ids.push(this.root.id)
			for (var i = 0; i < this.data.persons.length; i++)
			{
				var everyNode = this.findRoot(this.findPersonById(this.data.persons[i].id));
				if (jQuery.inArray(everyNode.node.id, ids) == -1 && everyNode.node.name.length != 0 
					&& everyNode.node.gender=='m' && everyNode.node.id != this.data.persons[i].id)
				{
					everyNode.level = personLevels[everyNode.node.id];
					temp_nodes.push(everyNode);
					ids.push(everyNode.node.id);
				}
			}
			if (temp_nodes.length > 1)
			{
				var top_ancesterM, top_ancesterF, top_level;
				top_ancesterM = this.createVirtual();
				top_ancesterF = this.createVirtual('f');
				this.linkTwoPerson(this.data.persons[top_ancesterM]["id"],"partnerF", 
					this.data.persons[top_ancesterF]["id"],"partnerM");
				top_level = temp_nodes[0].level + 1;

				for (var i=1;i<temp_nodes.length-1;i++)
				{
					var temp_ = temp_nodes[i];
					temp_nodes[i] = temp_nodes[temp_nodes.length - i];
					temp_nodes[temp_nodes.length - i] = temp_;
					if (i*2>temp_nodes.length-1) break;
				}

				for (var i=0; i<temp_nodes.length;i++)
				{
					if (temp_nodes[i].level != 0 && 
						(i==0 || (i !=0 && !this.haveRelative(temp_nodes[i].node.id, temp_nodes[0].node.id))))
					{
						var curLevel = temp_nodes[i].level;
						var curId = temp_nodes[i].node.id;
						while((curLevel+1) < top_level)
						{
							var senior_ancesterM = this.createVirtual();
							var senior_ancesterF = this.createVirtual('f');
							this.linkTwoPerson(this.data.persons[senior_ancesterM]["id"],"partnerF", 
								this.data.persons[senior_ancesterF]["id"],"partnerM");
							this.linkTwoPerson(curId, "father",
								this.data.persons[senior_ancesterM]["id"], "son");
							this.linkTwoPerson(curId, "mother",
								this.data.persons[senior_ancesterF]["id"], "son");
							curId = this.data.persons[senior_ancesterM]["id"];
							curLevel ++;
						}
						this.linkTwoPerson(curId, "father", this.data.persons[top_ancesterM]["id"], "son");
						this.linkTwoPerson(curId, "mother", this.data.persons[top_ancesterF]["id"], "son");
					}
				}
			}

			// console.log(this.data.persons);
			// console.log(this.data.relationships);
			// console.log(temp_nodes);
		}

		this.loaderShow();
		this.root = this.findRoot().node;

		this.graph = this.buildTree(this.root);
		//lg(JSON.stringify(this.graph));
		this.processGraph();
		//lg(this.graph);
		//return false;
		
		timeMiddle = new Date();

		if ($('.my-entire-family').attr('attr') == 'selected')
		{
			var avgX, sumX = 0; 
			var bottom_level = top_level;
			for (var i = 0; i < personLevels.length; i++)
			{
				if (bottom_level > personLevels[i])
					bottom_level = personLevels[i];
			}
			for (topLv = top_level-1; topLv >= bottom_level; topLv--)
			{
				var posArr = [];
				for (var i = 0; i < this.data.persons.length; i++)
				{
					// console.log(personLevels[parseInt(this.data.persons[i].id)]);
					if (topLv == top_level-1 && this.data.persons[i].x != undefined)
						sumX += this.data.persons[i].x;
					if (personLevels[parseInt(this.data.persons[i].id)] == topLv 
						&& this.data.persons[i].name != '' 
						&& this.data.persons[i].email != 'VIRTUAL')
					{
						// console.log(this.data.persons[i]);
						var x = {};
						if (this.data.persons[i].x != undefined)
						{
							x["ind"] = i;
							x["pos"] = this.data.persons[i].x;
							if (posArr.length > 0)
							{
								var inserted = false;
								for (j=0;j<posArr.length;j++)
								{
									if (posArr[j]['pos'] > x["pos"])
									{
										posArr.splice(j, 0, x);
										inserted = true;
										break;
									}
								}
								if (inserted == false)
									posArr.push(x);
							}
							else
								posArr.push(x);
						}
					}
				}
				avgX = sumX / this.data.persons.length;
				for (i=0;i<posArr.length;i++)
				{
					var diff = (posArr.length/2 - i);
				 	this.data.persons[ posArr[i]['ind'] ].x = avgX - 310 * diff;
				}
			}
		}
		
		this.refresh(this.renderGraph(this.graph));
		
		timeEnd = new Date();
		
		// calculate processing and rendering times
		this.time.processing = (timeMiddle.getTime() - timeStart.getTime()) / 1000;
		this.time.rendering = (timeEnd.getTime() - timeMiddle.getTime()) / 1000;
		
		this.bindViewControls(); 
		this.centerOnId(tree.me.id);

		this.loaderHide();
		this.time.total = (timeEnd.getTime() - timeStart.getTime()) / 1000;
		lg('Processing tree in ' + this.time.processing + '; rendered in ' + this.time.rendering + '; total time ' + this.time.total);

	},
	
	renderGraph: function(graph){
		var html = {cards: [], paths: []};
		html.cards.push( this.createCard(graph.person, graph.person.x, graph.person.y) );
		var d = Math.round((graph.partners.male.length - 1) * ph / 2) * -1;
		for (var i = 0; i < graph.partners.male.length; i++)
		{
			var 
				pid = graph.partners.male[i].partner.person.id,
				expand = (this.hasFather(pid) || this.hasMother(pid) || this.hasPartner(pid, graph.person.id)) ? true : false;
			html.cards.push( this.createCard(graph.partners.male[i].partner.person, graph.partners.male[i].partner.person.x, graph.partners.male[i].partner.person.y, expand) );
			var 
				childFirst = false,
				childLast  = false;
			
			// connect parent to child/ren
			if (graph.partners.male[i].children.length > 0)
			{
				var 
					p = this.getCardCenter(graph.partners.male[i].partner.person),
					p3 = {x: p.x + nwh + nsh, y: p.y + d},
					p4 = {x: p.x + nwh + nsh, y: p.y + nlh};
				var is_hidden = '';
				if ((graph.partners.male[i].partner.person.email === 'VIRTUAL' 
					&& graph.partners.male[i].partner.person.name === 'VIRTUAL') ||
					(graph.person.email === 'VIRTUAL' 
					&& graph.person.name === 'VIRTUAL'))
					is_hidden = ' hidden';
				html.paths.push( this.connectPoints(p3, p4, 0, 0, is_hidden) );
			}

			for (var j = 0; j < graph.partners.male[i].children.length; j++)
			{
				var temp = this.renderGraph(graph.partners.male[i].children[j]);
				html.cards = html.cards.concat( temp.cards );
				html.paths = html.paths.concat( temp.paths );
				
				// connect children to parent
				var 
					p1 = this.getCardCenter(graph.partners.male[i].children[j].person),
					p2 = {x: p1.x, y: p1.y - nlh};
				var is_hidden = '';
				if ((graph.partners.male[i].children[j].person.email === 'VIRTUAL' 
					&& graph.partners.male[i].children[j].person.name === 'VIRTUAL') ||
					(graph.person.email === 'VIRTUAL' 
					&& graph.person.name === 'VIRTUAL'))
					is_hidden = ' hidden';
				html.paths.push( this.connectPoints(p1, p2, 0, 0, is_hidden) );
				html.paths.push( this.connectPoints(p4, p2, 0, 0, is_hidden) );
				
				if (j === 0) childFirst = graph.partners.male[i].children[j].person;
				if ((j !== 0) && (j === (graph.partners.male[i].children.length - 1))) childLast = graph.partners.male[i].children[j].person;
			}
			
			// connect partners
			html.paths.push( this.connectPartners(graph.person, graph.partners.male[i].partner.person, d, i) );
			
			
			// connect first with last child
			if (childFirst && childLast)
			{
				var
					p1 = this.getCardCenter(childFirst),
					p2 = this.getCardCenter(childLast);
			
				p1.y -= nlh;
				p2.y -= nlh;
				var is_hidden = '';
				if ((childFirst.email === 'VIRTUAL' && childFirst.name === 'VIRTUAL')
					 || (childLast.email === 'VIRTUAL' && childLast.name === 'VIRTUAL'))
					is_hidden = ' hidden';
				// html.paths.push( this.connectPoints(p1, p2, 0, 0, is_hidden) );
			}

			d += ph;
		}
		
		var d = Math.round((graph.partners.female.length - 1) * ph / 2) * -1;
		
		for (var i = 0; i < graph.partners.female.length; i++)
		{
			var 
				pid = graph.partners.female[i].partner.person.id,
				expand = (this.hasFather(pid) || this.hasMother(pid) || this.hasPartner(pid, graph.person.id)) ? true : false;
			html.cards.push( this.createCard(graph.partners.female[i].partner.person, graph.partners.female[i].partner.person.x, graph.partners.female[i].partner.person.y, expand) );
			
			var 
				childFirst = false,
				childLast  = false;

			// connect parent to child/ren
			if (graph.partners.female[i].children.length > 0)
			{
				var 
					p = this.getCardCenter(graph.partners.female[i].partner.person),
					p3 = {x: p.x - nwh - nsh, y: p.y + d},
					p4 = {x: p.x - nwh - nsh, y: p.y + nlh};
				var is_hidden = '';
				if ((graph.partners.female[i].partner.email === 'VIRTUAL' 
					&& graph.partners.female[i].partner.name === 'VIRTUAL')  ||
					(graph.person.email === 'VIRTUAL' 
					&& graph.person.name === 'VIRTUAL'))
					is_hidden = ' hidden';
				html.paths.push( this.connectPoints(p3, p4, 0, 0, is_hidden) );
			}
			
			for (var j = 0; j < graph.partners.female[i].children.length; j++)
			{
				var temp = this.renderGraph(graph.partners.female[i].children[j]);
				html.cards = html.cards.concat( temp.cards );
				html.paths = html.paths.concat( temp.paths );
				
				// connect children to parent
				var 
					p1 = this.getCardCenter(graph.partners.female[i].children[j].person),
					p2 = {x: p1.x, y: p1.y - nlh};
				var is_hidden = '';
				if ((graph.partners.female[i].children[j].person.email === 'VIRTUAL' 
					&& graph.partners.female[i].children[j].person.name === 'VIRTUAL')  ||
					(graph.person.email === 'VIRTUAL' 
					&& graph.person.name === 'VIRTUAL'))
					is_hidden = ' hidden';
				html.paths.push( this.connectPoints(p1, p2, 0, 0, is_hidden) );
				html.paths.push( this.connectPoints(p2, p4, 0, 0, is_hidden) );
				
				if (j === 0) childFirst = graph.partners.female[i].children[j].person;
				if ((j !== 0) && (j === (graph.partners.female[i].children.length - 1))) childLast = graph.partners.female[i].children[j].person;
			}
			
			// connect partners
			html.paths.push( this.connectPartners(graph.person, graph.partners.female[i].partner.person, d, i) );
			
			// connect first with last child
			if (childFirst && childLast)
			{
				var
					p1 = this.getCardCenter(childFirst),
					p2 = this.getCardCenter(childLast);
			
				p1.y -= nlh;
				p2.y -= nlh;
				var is_hidden = '';
				if ((childFirst.email === 'VIRTUAL' && childFirst.name === 'VIRTUAL')
					 || (childLast.email === 'VIRTUAL' && childLast.name === 'VIRTUAL')
					 || (graph.person.email === 'VIRTUAL' && graph.person.name === 'VIRTUAL'))
					is_hidden = ' hidden';
				html.paths.push( this.connectPoints(p1, p2, 0, 0, is_hidden) );
			}

			d += ph;
		}
		
		return html;
	},
	
	processGraph: function(){
		this.graph = pt(this.graph, {
			width: nw,
			spacing: ns,
			height: nl
		});
	},
	
	buildTree: function(person){
		var
			rel = this.data.relationships,
			children = [],
			graph = {
				person: person,
				partners: {
					male: [],
					female: [],
					total: 0
				}
			};
		
		graph.person = person;
		// find partners
		for (var i = 0; i < rel.length; i++)
		{
			if ((rel[i].a === person.id) && (rel[i].r === 'partnerF' || rel[i].r === 'partnerM'))
			{
				children = this.findChildren(person.id, rel[i].b);
				var 
					childGraph = [],
					otherPartners = this.hasPartner(rel[i].b, graph.person.id),
					p = this.findPersonById(rel[i].b);
				
				for (var j = 0; j < children.length; j++)
				{
					childGraph.push(this.buildTree(children[j]));
				}
				if (p != undefined)
				{
					p.safeDelete = ((childGraph.length === 0) && (otherPartners === false) && (p.me !== '1'));

					if (rel[i].r === 'partnerF')
					{

						graph.partners.female.push({
							partner: {
								person: p
							},
							children: childGraph
						});
					}
					else
					{
						graph.partners.male.push({
							partner: {
								person: p
							},
							children: childGraph
						});
					}
					graph.partners.total++;
				}
			}
		}
		
		graph.person.safeDelete = ((graph.partners.total === 0) && (graph.person.me !== '1'));
		
		return graph;		
	},
	
	findPartners: function(a){
		var partners = [];
		
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];

			if ((rel.a === a) && (rel.r === 'partnerM' || rel.r === 'partnerF')) partners.push(this.findPersonById(rel.b));
		}
		
		return partners;
	},

	findChildren: function(partnerA, partnerB, justIds){
		var 
			children = [],
			childrenA = [],
			childrenB = [];
	
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];

			if ((rel.a === partnerA) && (rel.r === 'son' || rel.r === 'daughter')) childrenA.push(rel.b);
			if ((rel.a === partnerB) && (rel.r === 'son' || rel.r === 'daughter')) childrenB.push(rel.b);
		}
		
		for (var i = 0; i < childrenA.length; i++)
		{
			if (childrenB.hasValue(childrenA[i]))
			{
				if (justIds !== undefined)
				{
					children.push(childrenA[i]);
				}
				else
				{
					children.push(this.findPersonById(childrenA[i]));
				}
			}
		}

		// sort children - males first
		children.sort(function(a, b){
			if (a.gender === b.gender) return 0;
			return (a.gender === 'm') ? -1 : 1;
		});
		
		return children;
	},
	
	createCard: function(person, x, y, expand){
		if (person.placeholder === '1') return false;
		
		var 
			icon = null,
			dates = person.dobStr;
		var additional_class = '';
		if (person.email === 'VIRTUAL' && person.name === 'VIRTUAL')
		{
			additional_class = ' hidden';
		}	
		if (person.me === '1')
		{
			if (person.alive === '0')
			{
				icon = {
					tag: 'image',
					attributes: [
						{name: 'x', value: x + nw - 19},
						{name: 'y', value: y + nh - 20},
						{name: 'width', value: 19},
						{name: 'height', value: 18},
						{name: 'xlink:href', value: 'assets/img/logo.black.png'}
					],
					text: '',
					children: [
						{
							tag: 'title',
							attributes: [],
							text: 'Deceased',
							children: []
						}
					]
				};
				dates += ' - ' + person.dodStr;
			}
			else
			{
				icon = {
					tag: 'image',
					attributes: [
						{name: 'x', value: x + nw - 19},
						{name: 'y', value: y + nh - 20},
						{name: 'width', value: 19},
						{name: 'height', value: 18},
						{name: 'xlink:href', value: 'assets/img/logo.png'}
					],
					text: '',
					children: [
						{
							tag: 'title',
							attributes: [],
							text: 'Member',
							children: []
						}
					]
				};
			}
		}
		if ($('.my-entire-family').attr('attr') == 'selected')
			expand = null;
		if (expand)
		{
			expand = {
				tag: 'image',
				attributes: [
					{name: 'x', value: x},
					{name: 'y', value: y - 30},
					{name: 'class', value: 'nc-expand'+additional_class},
					{name: 'width', value: 30},
					{name: 'height', value: 30},
					{name: 'xlink:href', value: 'assets/img/ico-expand.png'}
				],
				text: '',
				children: [
					{
						tag: 'title',
						attributes: [],
						text: 'View ' + person.name + '\'s tree',
						children: []
					}
				]
			};
		}
		else
		{
			expand = null;
		}
		
		out = {
			tag: 'g',
			attributes: [
				{name: 'class', value: 'name-card'+additional_class},
				{name: 'data-safe-delete', value: person.safeDelete},
				{name: 'data-placeholder', value: '0'},
				{name: 'data-gender', value: person.gender},
				{name: 'data-name', value: person.name},
				{name: 'data-id', value: person.id}
			],
			text: '',
			children: [
				{
					tag: 'rect',
					attributes: [
						{name: 'x', value: x},
						{name: 'y', value: y},
						{name: 'class', value: 'nc-bg'},
						{name: 'width', value: 250},
						{name: 'height', value: 80},
						{name: 'fill', value: '#ffffff'},
						{name: 'stroke-width', value: 2},
						{name: 'stroke-linecap', value: 'butt'},
						{name: 'stroke-linejoin', value: 'round'},
						{name: 'stroke-dasharray', value: '0 250 0 80 250 80'},
						{name: 'rx', value: 0},
						{name: 'ry', value: 0}
					],
					text: '',
					children: []
				},
				{
					tag: 'text',
					attributes: [
						{name: 'x', value: x + 80},
						{name: 'y', value: y + 30},
						{name: 'class', value: 'nc-text'},
						{name: 'fill', value: '#919191'},
						{name: 'font-weight', value: 500},
						{name: 'font-size', value: '17px'},
						{name: 'text-anchor', value: 'start'}
					],
					text: person.name,
					children: []
				},
				{
					tag: 'text',
					attributes: [
						{name: 'x', value: x + 80},
						{name: 'y', value: y + 65},
						{name: 'class', value: 'nc-dob'},
						{name: 'fill', value: '#a0a0a0'},
						{name: 'font-weight', value: 400},
						{name: 'font-size', value: '12px'},
						{name: 'text-anchor', value: 'start'}
					],
					text: (person.alive === '1') ? person.dobStr : person.dobStr + ' - ' + person.dodStr,
					children: []
				},
				{
					tag: 'image',
					attributes: [
						{name: 'x', value: x + 10},
						{name: 'y', value: y + 10},
						{name: 'xlink:href', value: person.image},
						{name: 'class', value: 'nc-photo'},
						{name: 'width', value: 60},
						{name: 'height', value: 60}
					],
					text: '',
					children: []
				}
			]
		};
		
		if (icon !== null) out.children.push(icon);
		if (expand !== null) out.children.push(expand);
		
		return out;
	},
	
	findPersonById: function(id){
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (this.data.persons[i].id === id) return this.data.persons[i];
		}
	},
	
	findPersonInTree: function(id, graph){
		if (graph.person.id === id) return graph.person;
		
		for (var i = 0; i < graph.partners.male.length; i++)
		{
			if (graph.partners.male[i].partner.person.id === id) return graph.partners.male[i].partner.person;
			
			for (var j = 0; j < graph.partners.male[i].children.length; j++)
			{
				var result = this.findPersonInTree(id, graph.partners.male[i].children[j]);
				
				if (result !== false) return result;
			}
		}
		
		for (var i = 0; i < graph.partners.female.length; i++)
		{
			if (graph.partners.female[i].partner.person.id === id) return graph.partners.female[i].partner.person;
			
			for (var j = 0; j < graph.partners.female[i].children.length; j++)
			{
				var result = this.findPersonInTree(id, graph.partners.female[i].children[j]);
				
				if (result !== false) return result;
			}
		}
		
		return false;
	},
	
	getNameById: function(id){
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (this.data.persons[i].id === id) return this.data.persons[i].name;
		}
	},
	
	findRoot: function(node, level){
		var 
			m = null,
			f = null;
		
		if (node === undefined) node = this.me;
		if (level === undefined) level = 0;
		
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			if ((rel.a === node.id) && (rel.r === 'mother')) m = this.findRoot(this.findPersonById(rel.b), level + 1);
			if ((rel.a === node.id) && (rel.r === 'father')) f = this.findRoot(this.findPersonById(rel.b), level + 1);
		}
		
		if ((m === null) && (f === null)) return {node: node, level: level};
		if ((m === null) && (f !== null)) return f;
		if ((m !== null) && (f === null)) return m;

		return (m.level > f.level) ? m : f;
	},
	
	findMe: function(){
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (this.data.persons[i].id === profileId)
			{
				this.me = this.data.persons[i];
				break;
			}
		}
	},
	
	hasFather: function(id){
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			
			if ((rel.a === id) && (rel.r === 'father'))
			{
				var person = this.findPersonById(rel.b);
				if (person.placeholder === '0') return true;
			}
		}
		return false;
	},
	
	hasMother: function(id){
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			
			if ((rel.a === id) && (rel.r === 'mother'))
			{
				var person = this.findPersonById(rel.b);
				if (person.placeholder === '0') return true;
			}
		}
		return false;
	},
	
	hasPartner: function(id, not){
		var possible = ['partnerF', 'partnerM'];
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];

			if (not !== undefined)
			{
				if ((rel.a === id) && (rel.b !== not) && (possible.hasValue(rel.r))) return true;
			}
			else
			{
				if ((rel.a === id) && (possible.hasValue(rel.r))) return true;
			}
		}
		return false;
	},
	
	getPartners: function(id){
		var 
			possible = ['partnerF', 'partnerM'],
			partners = [];
	
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			
			if ((rel.a === id) && (possible.hasValue(rel.r))) partners.push({id: rel.b, name: this.getNameById(rel.b)});
		}
		return partners;
	},
	
	getCardCenter: function(obj){
		return {x: obj.x + nwh, y: obj.y + nhs};
	},
	
	connectPartners: function(a, b, d, i, is_hidden){
		var 
			p1 = this.getCardCenter(a),
			p2 = this.getCardCenter(b);
		
		if (a.placeholder === '1')
		{
			p1.x += (a.gender === 'm') ? (nwh + nsh) : (nwh + nsh) * - 1;
		}
		
		if (b.placeholder === '1')
		{
			p2.x += (b.gender === 'm') ? (nwh + nsh) : (nwh + nsh) * - 1;
		}
		if ((a.email === 'VIRTUAL' && a.name === 'VIRTUAL') ||
			(b.email === 'VIRTUAL' && b.name === 'VIRTUAL'))
			is_hidden = ' hidden';
		return this.connectPoints(p1, p2, d, i, is_hidden);
	},
	
	connectPoints: function(a, b, d, index, is_hidden){
		var 
			p1 = {x: a.x, y: a.y + d},
			p2 = {x: b.x, y: b.y + d},
			color = (index < 4) ? styles['path' + (index + 1)] : style = styles.path4;
		if (is_hidden == undefined) is_hidden = '';
		return {
			tag: 'path',
			attributes: [
				{name: 'data-holder', value: d},
				{name: 'd', value: 'M ' + p1.x + ' ' + p1.y + ' L ' + p2.x + ' ' + p2.y + ' z'},
				{name: 'stroke-width', value: '3'},
				{name: 'stroke', value: color},
				{name: 'class', value: ''+is_hidden}
			],
			text: '',
			children: []
		};
	},
	
	centerOnId: function(id){
		var
			p = this.findPersonInTree(id, this.graph),
			c = tree.getCardCenter(p),
			realZoom = tree.pz.getSizes().realZoom;

		tree.pz.pan({  
			x: -(c.x*realZoom)+(tree.pz.getSizes().width/2),
			y: -(c.y*realZoom)+(tree.pz.getSizes().height/2)
		});
	},
	
	search: function(){
		var 
			input = $('.tree-search').val(),
			html = '';

		for (var i = 0; i < tree.data.persons.length; i++)
		{
			var p = tree.data.persons[i];

			if (p.name.toLowerCase().indexOf(input.toLowerCase()) > -1)
			{
				html += '<li data-id="' + p.id + '">' + p.name + '</li>';
			}
		}

		if (html === '') html = '<li class="none">No results found</li>';

		$('.tree-search-holder > ul').remove();
		$('.tree-search-holder').append('<ul>' + html + '</ul>');
	},
	
	searchResultClick: function(obj){
		var id = obj.attr('data-id');
		
		if ($('.name-card[data-id="' + id + '"]').length > 0)
		{
			this.centerOnId(id);
			this.searchClose();
		}
		else
		{
			this.me = tree.findPersonById(id);
			this.render();
		}
	},
	
	searchClose: function(){
		$('.tree-search').val('');
		$('.tree-search-holder > ul').remove();
	},

	listenerExpandTree: function(e){
		var id = $(this).parent().attr('data-id');
		tree.me = tree.findPersonById(id);
		tree.render();
	},
	
	removeListeners: function(){
		$('.name-card .nc-expand').each(function(){
			this.removeEventListener('click', tree.listenerExpandTree, false);
		});
	},
		
	refresh: function(html){
	
		// refresh tree
		this.clearNode('viewport');
		
		var connections = {tag: 'g', attributes: [{name: 'class', value: 'connections'}], text: '', children: html.paths};

		$('.view').append(tree.makeTag(connections));	
		html.cards.forEach(function(card){
			$('.view').append(tree.makeTag(card));
		});
		// fix text width on name cards
		$('.name-card > .nc-text').each(function(){
			//fitText($(this), 160);
		});

		// add event listeners for card controls	
		$('.name-card .nc-add').each(function(){
			this.addEventListener('click', tree.listenerAddPerson, false);
		});
		
		$('.name-card .nc-edit').each(function(){
			this.addEventListener('click', tree.listenerEditPerson, false);
		});
		
		$('.name-card .nc-expand').each(function(){
			this.addEventListener('click', tree.listenerExpandTree, false);
		});
		
		$('.name-card .nc-invite').each(function(){
			this.addEventListener('click', tree.listenerInvite, false);
		});
	},
	
	clearNode: function(id){
		var node = document.getElementById(id);
		while (node.firstChild)
		{
			node.removeChild(node.firstChild);
		}
	},
	
	makeTag: function(o){
		var node = document.createElementNS("http://www.w3.org/2000/svg", o.tag);

		if (o === false) return '';
		
		o.attributes.forEach(function(a){
			var ns = (a.name === 'xlink:href') ? 'http://www.w3.org/1999/xlink' : null;
			node.setAttributeNS(ns, a.name, a.value);
		});
		
		o.children.forEach(function(child){
			node.appendChild(tree.makeTag(child));
		});
		
		if (o.text !== '')
		{
			node.appendChild(document.createTextNode(o.text));
		}

		return node;
	},
	
	loaderShow: function(){
		$('#tree').css('opacity', 0);
		$('.svg-container .loading').css('opacity', 1);
	},
	
	loaderHide: function(){
		$('.svg-container .loading').css('opacity', 0);
		$('#tree').animate({ opacity: 1 }, animationSpeed);
		
		/*
		sleep(1500).then(function(){
			$('.svg-container .loading').css('opacity', 0);
			$('#tree').animate({ opacity: 1 }, animationSpeed);
		});
		*/
	},
	
	bindViewControls: function(){
		if (tree.pz != null)
			tree.pz.destroy();
		tree.pz = svgPanZoom('#tree',{
			contain: false,
			fit: false,
			center: true,
			maxZoom: 2,
			minZoom: 0.1,
			dblClickZoomEnabled: false,
			//mouseWheelZoomEnabled: false,
			beforePan: function(oldPan, newPan){
				var stopHorizontal = false
				  , stopVertical = false
				  , gutterWidth = 100
				  , gutterHeight = 100
					// Computed variables
				  , sizes = this.getSizes()
				  , leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth
				  , rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom)
				  , topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight
				  , bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom);
				customPan = {};
				customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x));
				customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y));
				return customPan;
			},
			onZoom: function(level){
				slider.slider('setValue', level);
			}
		});
		tree.pz.zoom(0.75);
	},
	
	fetchTree: function(){
		request({
			data: {
				act: 'FamilyTreeView-fetchTree',
				id: tree.profileId
			},
			success: function(r){
				tree.data = r.tree;
				if (tree.me === null) tree.findMe();
				tree.render();
			}
		});
	},
	
	resize: function(){
		$('svg').css('height', $(window).height() - 61);
		if (tree.pz !== null)
		{
			tree.pz.resize();
			tree.pz.center();
		}
	},
	
	init: function(pid){
		this.profileId = pid;
		this.resize();
		this.removeListeners();
		this.fetchTree();
	}
};

$(document).ready(function(){
	tree.init(profileId);
	slider = $('.slider').slider({
		orientation: 'vertical',
		min: 0.1,
		max: 2,
		step: 0.01,
		value: 1,
		handle: 'custom',
		tooltip: 'hide'
	});
});
$(document).on('click','.my-family', function(){
	$('.my-entire-family').attr('attr','');
	$(this).attr('attr','selected');
	$('.tree-search-holder').show();
	tree.init(profileId);
});
$(document).on('click','.my-entire-family', function(){
	$('.my-family').attr('attr','');
	$(this).attr('attr','selected');
	$('.tree-search-holder').hide();
	tree.findMe();
	tree.init(profileId);
});
$(window).resize(function(){
	tree.resize();
});

/*** Tree search ***/

$(document).on('click', '.tree-search', function(e){
	e.stopPropagation();
});

$(document).on('keyup', '.tree-search', function(){
	tree.search();
});

$(document).on('click', '.tree-search-holder ul li', function(){
	if ($('.my-family').attr('attr') == 'selected')
		tree.searchResultClick($(this));
});

$(document).on('click', 'body', function(){
	tree.searchClose();
});

/*** View controls ***/

$(document).on('click', '.view-control .zoom-in', function(){
	tree.pz.zoomIn();
	slider.slider('setValue', tree.pz.getZoom());
});

$(document).on('click', '.view-control .zoom-out', function(){
	tree.pz.zoomOut();
	slider.slider('setValue', tree.pz.getZoom());
});

$(document).on('click', '.view-control .zoom-reset', function(){
	tree.pz.resetZoom();
});

$(document).on('click', '.view-control .pan-top', function(){
	tree.pz.panBy({x: 0, y: -200});
});

$(document).on('click', '.view-control .pan-left', function(){
	tree.pz.panBy({x: -200, y: 0});
});

$(document).on('click', '.view-control .pan-right', function(){
	tree.pz.panBy({x: 200, y: 0});
});

$(document).on('click', '.view-control .pan-bottom', function(){
	tree.pz.panBy({x: 0, y: 200});
});

$(document).on('click', '.view-control .pan-home', function(){
	tree.centerOnId(tree.me.id);
});

$(document).on('slide', '.slider', function(e){
	tree.pz.zoom(e.value);
});

$(document).on('change', '.slider', function(e){
	tree.pz.zoom(e.value.newValue);
});

/*** Tree manipulation ***/

$(document).on('mousedown', '.svg-container', function(){
	$(this).addClass('grabbing');
});

$(document).on('mouseup', '.svg-container', function(){
	$(this).removeClass('grabbing');
});