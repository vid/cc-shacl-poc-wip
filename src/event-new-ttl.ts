import stringToStream from 'string-to-stream'
import { parsers } from '@rdfjs-elements/formats-pretty'

export const xottl = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix schema: <http://schema.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dash: <http://datashapes.org/dash#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix vcard: <http://www.w3.org/2006/vcard/ns#> .

@prefix ex: <http://example.com/> .
@prefix lexvo: <http://lexvo.org/id/iso639-1/> .

ex:EventShape
  a sh:Shape ;
  sh:targetClass schema:Event ;
  rdfs:label "Event name" ;
  sh:property ex:NameProperty 
#                 ex:KnowsProperty ,
#                 ex:AgeProperty ,
#                 ex:GenderProperty ,
#                 ex:SpokenLanguagesProperty  ,
#                 ex:DateOfBirthProperty ,
#                 ex:HomePageProperty ;
.

ex:SimplifiedPersonShape
  a sh:Shape ;
  sh:targetNode ex:Jane_Doe ;
  rdfs:label "Person (name-only)" ;
  sh:property ex:NameProperty ;
.

ex:NameProperty
  sh:path schema:name ;
  sh:name "Name" ;
  sh:datatype xsd:string ;
  dash:singleLine true ;
  sh:maxCount 1 ;
  sh:minLength 1;
  sh:minCount 1 ;
  sh:order 1 ;
.

ex:KnowsProperty
  sh:path schema:knows ;
  sh:class schema:Person ;
  sh:group ex:FriendGroup ;
.

ex:AgeProperty
  sh:path schema:age ;
  sh:name "Age" ;
  sh:datatype xsd:integer ;
  sh:maxCount 1 ;
  sh:defaultValue 21 ;
  sh:order 2 ;
  sh:minInclusive 18 ;
.

ex:GenderProperty
  sh:path foaf:gender ;
  sh:name "Gender" ;
  sh:in (
    "Male" "Female" "Other" "Prefer not to tell"
  ) ;
  sh:maxCount 1 ;
  sh:order 3 ;
  sh:message "Please select a valid gender" ;
.

ex:DateOfBirthProperty
  sh:path schema:birthDate ;
  sh:name "Date of birth" ;
  sh:maxCount 1 ;
  sh:order 4 ;
  sh:datatype xsd:date ;
.

ex:SpokenLanguagesProperty
  sh:path vcard:language ;
  sh:name "Spoken languages" ;
  sh:nodeKind sh:IRI ;
  sh:in (
    lexvo:en lexvo:de lexvo:fr lexvo:pl lexvo:es
  ) ;
  sh:order 5 ;
  sh:minCount 1 ;
  sh:maxCount 2 ;
.

ex:HomePageProperty
  sh:path foaf:homepage ;
  sh:name "Homepage URL" ;
  sh:nodeKind sh:IRI ;
  sh:order 6 ;
.

ex:FriendGroup
  a sh:PropertyGroup ;
  rdfs:label "Acquaintances"
.

lexvo:en rdfs:label "English" .
lexvo:de rdfs:label "German" .
lexvo:fr rdfs:label "French" .
lexvo:pl rdfs:label "Polish" .
lexvo:es rdfs:label "Spanish" .
`;


export async function parseTTL() {
  const inputStream = stringToStream(xottl)
  const quads = []

  const quadStream = parsers.import('text/turtle', inputStream)
  for await (const quad of quadStream) {
    quads.push(quad)
  }

  return quads;
}
