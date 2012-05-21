var containerURI = generateURI("DataContainer");
// timestamp format: YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
var now = new Date();
var timestamp = ISODateString(now);
swapTriple(containerURI, "http://purl.org/dc/terms/created", timestamp );
swapTriple(containerURI, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://hxl.humanitarianresponse.info/#DataContainer" );

var resourceuri = ""; // this one will save the URI of the resource we are generating data about

// the prefixes for our SPARQL queries:
var prefixes = "PREFIX owl: <http://www.w3.org/2002/07/owl#> \nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \nPREFIX foaf: <http://xmlns.com/foaf/0.1/> \nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \nPREFIX skos: <http://www.w3.org/2004/02/skos/core#> \nPREFIX hxl: <http://hxl.humanitarianresponse.info/#> \n";

// ----------------------------------------------------------
// add autocomplete to the elements at the top:	

var endpointURL = "http://83.169.33.54:8080/parliament/sparql";
var queryUrl = "http://jsonp.lodum.de/?endpoint=" + endpointURL;

// add the autosuggest function to the hxl class selection:
var sparqlQuery = prefixes + "SELECT * WHERE { { Graph <http://hxl.carsten.io/graph/hxlvocab> { ?hxlclass a rdfs:Class ; skos:prefLabel ?hxllabel; rdfs:comment ?desc . } } UNION { Graph <http://hxl.carsten.io/graph/hxlvocab> { ?hxlclass a rdfs:Class ; skos:altLabel ?hxllabel . } } } ORDER BY ?hxlclass";


$.ajax({
    dataType: "jsonp",
    url: queryUrl,
    data: {
        query: sparqlQuery
    },
    success: function(json) {

        var hxlClasses = new Array();

        var bindings = json.results.bindings;

        $.each(bindings,
        function(i) {
            var hxlclass = bindings[i].hxlclass.value;
            var hxllabel = bindings[i].hxllabel.value;
            if (bindings[i].desc == null) {
                var hxldesc = bindings[i].hxllabel.value;;
            } else {
                var hxldesc = bindings[i].desc.value;
            }
            hxlClasses[i] = {
                label: hxllabel,
                value: hxlclass,
                desc: hxldesc
            };
        })


        $("#classes").autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(hxlClasses, request.term);

                if (!results.length) {
                    $("#classes").removeClass("loading");
                    $("#classes").addClass("noresults");
                } else {
                    $("#classes").removeClass("noresults");
                }

                response(results);
            },
            select: function(event, ui) {
                newOrExisting(ui.item.label, ui.item.value, ui.item.desc);
            },
            search: function(event, ui) {
                $("#datainput").slideUp("fast");
                $("#properties").html(" ");
                $("#classes").addClass("loading");
            },
            open: function(event, ui) {
                $("#classes").removeClass("loading");
            }
        }).data("autocomplete")._renderItem = function(ul, item) {
            return $("<li></li>")
            .data("item.autocomplete", item)
            .append("<a>" + item.label + "<br /><small>" + item.desc + "</small></a>")
            .appendTo(ul);
        };
    }
});

// add autosuggest to the name field:
sparqlQuery = prefixes + "SELECT ?person ?name WHERE {GRAPH ?g {  ?person a foaf:Person ; foaf:name ?name .}}ORDER BY ?name";

$.ajax({
    dataType: "jsonp",
    url: queryUrl,
    data: {
        query: sparqlQuery
    },
    success: function(json) {

        var people = new Array();

        var bindings = json.results.bindings;

        $.each(bindings,
        function(i) {
            var personuri = bindings[i].person.value;
            var personname = bindings[i].name.value;
            people[i] = {
                label: personname,
                value: personuri
            };
        })


        $("#personreporting").autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(people, request.term);

                if (!results.length) {
                    $("#personreporting").removeClass("loading");
                } 

                response(results);
            },
            open: function(event, ui) {
                $("#personreporting").removeClass("loading");
            }
        });
    }
});

// add autosuggest to the organisation field:
//sparqlQuery = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX hxl: <http://hxl.humanitarianresponse.info/#> PREFIX skos: <http://www.w3.org/2004/02/skos/core#> SELECT * WHERE {GRAPH ?g1 {  ?org rdf:type/rdfs:subClassOf* hxl:Organisation . }GRAPH ?g2 { ?org ?pr ?sub . }GRAPH <http://hxl.carsten.io/graph/hxlvocab> { OPTIONAL { ?pr skos:prefLabel ?pred . } }}ORDER BY ?org"; // show everything about the org?

sparqlQuery = prefixes + "SELECT DISTINCT ?org ?name ?abbr WHERE { GRAPH ?g1 {  ?org rdf:type/rdfs:subClassOf* hxl:Organisation ; hxl:orgName ?name ; hxl:abbreviation ?abbr . }} ORDER BY ?org";

$.ajax({
    dataType: "jsonp",
    url: queryUrl,
    data: {
        query: sparqlQuery
    },
    success: function(json) {

        var people = new Array();

        var bindings = json.results.bindings;

        $.each(bindings,
        function(i) {
            var org = bindings[i].org.value;
            var name = bindings[i].name.value;
            var abbr = bindings[i].abbr.value;
            people[i] = {
                label: abbr + " / " + name ,
                value: org
            };
        })


        $("#orgreporting").autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(people, request.term);

                if (!results.length) {
                    $("#orgreporting").removeClass("loading");
                } 

                response(results);
            },
            open: function(event, ui) {
                $("#orgreporting").removeClass("loading");
            }
        });
    }
});

// ----------------------------------------------------------
// add event listeners to the elements that we want to observe	
$('#personreporting').bind('focus blur', function() {
	var person = $('#personreporting').val();
	if(person.length > 0){
		var personURI = makeURI(person, "Person");
		if (person != personURI){
			swapTriple(personURI, "http://xmlns.com/foaf/0.1/name", $('#personreporting').val());
			swapTriple(personURI, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://xmlns.com/foaf/0.1/Person");			
		}
	    swapTriple(containerURI, "http://hxl.humanitarianresponse.info/#reportedBy", personURI);
    }
    // if we know which organisation is reporting, add membership information:
    swapMemberTriple();			
});

$('#orgreporting').bind('focus blur', function() {
	var org = $('#orgreporting').val();
	if(org.length > 0){
		var orgURI = makeURI(org, "Organisation"); 
		if (org != orgURI){ // new URI, add name infos:
			swapTriple(orgURI, "http://hxl.humanitarianresponse.info/#orgDisplayName", $('#orgreporting').val());
			swapTriple(orgURI, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://hxl.humanitarianresponse.info/#Organisation");
		}
    	swapTriple(containerURI, "http://hxl.humanitarianresponse.info/#reportedBy", orgURI);    	
    }
    // if we know who is reporting, add membership information:
    swapMemberTriple();
});

/* $('#primary').change(function() {
    swapTriple(containerURI, "http://hxl.humanitarianresponse.info/#containsPrimaryData", "true");
});

$('#secondary').change(function() {
    swapTriple(containerURI, "http://hxl.humanitarianresponse.info/#containsSecondaryData", "true");
}); */

$('#datacollection').bind('focus blur', function() {
    swapTriple(containerURI, "http://hxl.humanitarianresponse.info/#dataCollectionProcess", $('#datacollection').val());
});

$('#submitform').submit(function(){
	forward();
});


// ---------------------------------------------------------------------------------------------------
// HELPER FUNCTIONS

function swapMemberTriple(){
	var org = $('#orgreporting').val();
	var person = $('#personreporting').val();
	if(person.length > 0 && org.length > 0){
		org = makeURI(org, "Organisation");
		person = makeURI(person, "Person");
	
	}
	swapTriple(org, "http://xmlns.com/foaf/member/", person);
}

// turns a name into a URI depending on type, e.g.
// name: UNDP, type: Organisation
// -> http://hxl.carsten.io/organisation/undp
// if the input is already a URL (starting with "http://"), simply returns it
function makeURI(name, type){
	if (name.indexOf("http://") != 0){
		var fragment = name.replace(/\s+/g, '_'); // replace whitespaces
		name = "http://hxl.carsten.io/"+type.toLowerCase()+"/" + fragment.toLowerCase();		
	}	
	return name;
}

function forward(){
	console.log($('#update').val());
	$("#confirmation").html('<p><b>Thank you! The information you have submitted should now be available at <a href="' + containerURI + '" target="_blank">' + containerURI + '</a>, unless you see an error message somewhere around here.</b></p><p>Do you want to <a href="">report more data</a>?');
	$("#submitHXL").attr("disabled", true);
	$("#submitHXL").remove();
	$("#confirmation").slideDown();
	$('html,body').animate({scrollTop: $("#confirmation").offset().top},'fast');
	
}

// if the triple "subject predicate object" is already in the editor, remove it
// otherwise, add it
function swapTriple(subject, predicate, obj) {
    if (subject != '' && predicate != '' && obj != '') {
        var content = hxleditor.getValue();        
        var triple = getTriple(subject, predicate, obj);
        //check if triple is already there:
        if (content.indexOf(triple) == -1) {
            // not there, so add it
            hxleditor.setValue(content + triple);
        } else {
            //already there, remove it:
            hxleditor.setValue(content.split(triple).join(''));
        }
        
        // refresh the sparql update script after every change:
        $("#update").val('CREATE GRAPH <' + containerURI + '> INSERT DATA INTO <' + containerURI + '> {' + hxleditor.getValue() + '}');	
    }
}

function getTriple(subject, predicate, obj) {
	// figure out whether the object is a literal
	if(obj.indexOf('http://') == 0){
		object = '<' + obj + '>';
	}else{
		object = '"' + obj + '"';
	}
	var triple = "<" + subject + "> <" + predicate + "> " + object + " .\n";
	return triple;
}

// ask the user whether to create a new resource or add information to an existing one
function newOrExisting(classLabel, hxlClass, description){
	$("#resourcedescription").html('<p>Do you want to <br /><input type="radio" name="newexisting" value="existing"> add information about an existing '+ classLabel + ' or	<input type="radio" name="newexisting" value="new"> create a new one?<br />  Search the existing ones:</p>');
	
	$("#resourcedescription").append('<input id="pickResource" size="80" />');
	
	var uri = generateURI(hxlClass);
	var html = "<p id='makenewresource'>Automatically generated URI for your " + classLabel + ": <span id='resourceuri'>" + uri + "</span></p>";
	
	resourceuri = uri; 
	
	// change listener for the radio button:
	$("input[name='newexisting']").change(function(){
		var triple = getTriple(resourceuri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", hxlClass);
		var content = hxleditor.getValue();        
		
	    if ($("input[name='newexisting']:checked").val() == 'existing'){
	    	$("#pickResource").attr("disabled", false);	    
	        $("#makenewresource").remove();
	        hxleditor.setValue(content.split(triple).join(''));
	    }else if ($("input[name='newexisting']:checked").val() == 'new'){
	    	$("#pickResource").attr("disabled", true);
	    	$("#resourcedescription").append(html);
	    	resourceuri = uri;
	    	hxleditor.setValue(content + triple);
	    }
	   	// refresh the sparql update script after every change:
	   	$("#update").val('CREATE GRAPH <' + containerURI + '> INSERT DATA INTO <' + containerURI + '> {' + hxleditor.getValue() + '}');	 
	});
	
	var sparqlQuery = prefixes + "SELECT ?res ?pr ?pred ?obj WHERE { GRAPH ?g { ?res rdf:type/rdfs:subClassOf* <" + hxlClass + "> ; ?pr ?obj .  } 	GRAPH <http://hxl.carsten.io/graph/hxlvocab> { OPTIONAL { ?pr skos:prefLabel ?pred . } } } ORDER BY ?res";
	
	$.ajax({
	        dataType: "jsonp",
	        url: queryUrl,
	        data: {
	            query: sparqlQuery
	        },
	        success: function(json) {
	
	            var existingResources = new Array();
	
	            var bindings = json.results.bindings;
	
	            // we want to collect all triples about a resource, so we always store the last resource and start a new list entry when a new resource comes up
	            if (bindings.length > 0) {
					// only dive into the process if there are any matches
	                var lastResource = "";
	                var dataAbout = "";
	
	                $.each(bindings,
	                function(i) {
	                    
	                    if (bindings[i].pred == null) {
	                        // if there's no label for this predicate, try to shorten it to the fragment id:
	                        var val = bindings[i].pr.value;
	                        var arr = new Array();
	                        var arr = val.split("#");
	                        if (arr.length == 2) {
	                            var predicate = arr[1];
	                        } else {
	                            var predicate = bindings[i].pr.value;
	                        }
	                    } else {
	                        var predicate = bindings[i].pred.value;
	                    }
	                    var object = bindings[i].obj.value;
	
	                    dataAbout = dataAbout + predicate + ": " + object + "<br />"
						
						if (lastResource != bindings[i].res.value) {
 	                        lastResource = bindings[i].res.value;	 						
							
							// start over, next resource
	                        existingResources.push({
	                            label: lastResource,
	                            value: lastResource,
	                            desc: dataAbout
	                        });
	
	                        dataAbout = "";
							
							console.log("added to autosug");
	                    }
	
	                    
						
	                })
	
	            }
	
	            $("#pickResource").autocomplete({
	                source: function(request, response) {
	                    var results = $.ui.autocomplete.filter(existingResources, request.term);
	
	                    if (!results.length) {
	                        $("#pickResource").removeClass("loading");
	                        $("#pickResource").addClass("noresults");
	                    } else {
	                        $("#pickResource").removeClass("noresults");
	                    }
	
	
	                    response(results);
	                },
	                select: function(event, ui){
	                	// use this URI as the subject for our triples:
	                	resourceuri = ui.item.value;
	                }
	            }).data("autocomplete")._renderItem = function(ul, item) {
	                return $("<li></li>")
	                .data("item.autocomplete", item)
	                .append("<a>" + item.label + "<br /><small>" + item.desc + "</small></a>")
	                .appendTo(ul);
	            }
	        }
	    })
	
	showProperties(classLabel, hxlClass, description);	
}

function showProperties(classLabel, hxlClass, description) {
    showPropertiesByType(classLabel, hxlClass, description, "owl:ObjectProperty");
    showPropertiesByType(classLabel, hxlClass, description, "owl:DataProperty");
}


function showPropertiesByType(classLabel, hxlClass, description, propertyType) {
	
	var range = " ";
	if(propertyType == "owl:ObjectProperty"){
		range = "rdfs:range ?range; ";
	}
	
	var sparqlQuery = prefixes + "SELECT * WHERE { { Graph <http://hxl.carsten.io/graph/hxlvocab> { <" + hxlClass + "> rdfs:subClassOf* ?domain. ?hxlprop a " + propertyType + "; rdfs:domain ?domain ;" + range + "skos:prefLabel ?hxllabel; rdfs:comment ?desc . } } }";

	$.ajax({
        dataType: "jsonp",
        url: queryUrl,
        data: {
            query: sparqlQuery
        },
        success: function(json) {

            $("#datainput-h2").html("Data Input for <em>" + classLabel + "</em>");

            var bindings = json.results.bindings;
            $.each(bindings,
            function(i) {
                var hxlprop = bindings[i].hxlprop.value;
                var shortpropArr = hxlprop.split("#");
                var shortprop = shortpropArr[1];
                // show symbol for object properties:
                if (propertyType == "owl:ObjectProperty") {
                    var hxllabel = "<b>&infin;</b> " + bindings[i].hxllabel.value;
                } else {
                    var hxllabel = bindings[i].hxllabel.value;
                }

                if (bindings[i].desc == null) {
                    var hxldesc = " ";
                } else {
                    var hxldesc = "<small>" + bindings[i].desc.value + "</small><br />";
                }

                $("#properties").append("<label for=\"" + shortprop + "\">" + hxllabel + "<br />" + hxldesc + "						</label><input id=\"" + shortprop + "\" size=\"80\" /><br />");
                
                // add change listener to this element that takes care of generating the triple:
                $('#'+shortprop).bind('focus blur', function() {
	                var thisthing = $('#'+shortprop).val();
	                if(thisthing.length > 0){
	                	// only generate URIs if this is an object property:
	                	if(propertyType == "owl:ObjectProperty"){
	                		
	                		var shortRangeArr = bindings[i].range.value.split("#");
	                		var shortRange = shortRangeArr[1];
	                		var thisthingURI = makeURI(thisthing, shortRange);
		                	swapTriple(resourceuri, hxlprop, thisthingURI);
		                	if ((thisthing != thisthingURI)){
	                			swapTriple(thisthingURI, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", bindings[i].range.value); 	
	                		}
	                	}else{ // data property; just take the value:
	                		swapTriple(resourceuri, hxlprop, thisthing);
	                	}
		                
	                }            	
                });

                // create the autocomplete stuff fur object property fields
                if (propertyType == "owl:ObjectProperty") {
                    addAutoCompleteToField(shortprop);
                }
            })
            $("#datainput").slideDown("fast");
            $("#submitHXL").attr("disabled", false);
        }
    });
}

function addAutoCompleteToField(hxlPredicate) {

    var domID = "#" + hxlPredicate;

    $(domID).before("<p><small><em>You can select from existing resources, or create a new one by entering an appropriate name.");

    var sparqlQuery = prefixes + "SELECT ?res ?pr ?pred ?obj WHERE { GRAPH ?g { ?res a ?range ; ?pr ?obj .  } GRAPH <http://hxl.carsten.io/graph/hxlvocab> { hxl:" + hxlPredicate + " rdfs:range ?range . OPTIONAL { ?pr skos:prefLabel ?pred . } } } ORDER BY ?res";
	
    $.ajax({
        dataType: "jsonp",
        url: queryUrl,
        data: {
            query: sparqlQuery
        },
        success: function(json) {

            var existingResources = new Array();

            var bindings = json.results.bindings;

            // we want to collect all triples about a resource, so we always store the last resource and start a new list entry when a new resource comes up
            if (bindings.length > 0) {
                // only dive into the process if there are any matches
                var lastResource = bindings[0].res.value;
                var dataAbout = "";

                $.each(bindings,
                function(i) {
                    if (lastResource != bindings[i].res.value) {
                        // start over, next resource
                        existingResources.push({
                            label: lastResource,
                            value: lastResource,
                            desc: dataAbout
                        });

                        dataAbout = "";
                    }

                    lastResource = bindings[i].res.value;

                    if (bindings[i].pred == null) {
                        // if there's no label for this predicate, try to shorten it to the fragment id:
                        var val = bindings[i].pr.value;
                        var arr = new Array();
                        var arr = val.split("#");
                        if (arr.length == 2) {
                            var predicate = arr[1];
                        } else {
                            var predicate = bindings[i].pr.value;
                        }
                    } else {
                        var predicate = bindings[i].pred.value;
                    }
                    var object = bindings[i].obj.value;

                    dataAbout = dataAbout + predicate + ": " + object + "<br />"

                })

            }

            $(domID).autocomplete({
                source: function(request, response) {
                    var results = $.ui.autocomplete.filter(existingResources, request.term);

                    if (!results.length) {
                        $(domID).removeClass("loading");
                        $(domID).addClass("noresults");
                    } else {
                        $(domID).removeClass("noresults");
                    }


                    response(results);
                }
            }).data("autocomplete")._renderItem = function(ul, item) {
                return $("<li></li>")
                .data("item.autocomplete", item)
                .append("<a>" + item.label + "<br /><small>" + item.desc + "</small></a>")
                .appendTo(ul);
            }
        }
    })
}

// generates a URI of pattern:
// http://hxl.carsten.io/hxlClass/timestamp
function generateURI(hxlClass) {
    var arr = hxlClass.split("#");
    if (arr.length == 2) {
        var shortClass = arr[1];
    } else {
        var shortClass = hxlClass;
    }
    var now = new Date();
    // we'll use the time stamp as the unique part of the URI for the time being.
    var id = now.getTime();
    var URI = "http://hxl.carsten.io/" + shortClass.toLowerCase() + "/" + id;
    return URI;
}

// generates an ISO data string from a JS date object
function ISODateString(d) {
    function pad(n){
        return n<10 ? '0'+n : n
    }
    return d.getUTCFullYear()+'-'
    + pad(d.getUTCMonth()+1)+'-'
    + pad(d.getUTCDate())+'T'
    + pad(d.getUTCHours())+':'
    + pad(d.getUTCMinutes())+':'
    + pad(d.getUTCSeconds())+'Z'
}
