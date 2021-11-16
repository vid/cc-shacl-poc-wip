import stringToStream from 'string-to-stream'
import { parsers } from '@rdfjs-elements/formats-pretty'

export const xottl = `@prefix dash: <http://datashapes.org/dash#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix my: <http://my.example.com/> .

my:EventShape
  a sh:NodeShape ;
  rdfs:label "Event" ;
  sh:targetClass schema:Event ;
  sh:property my:NameShape, my:StartDateShape ;
  sh:xone (
    [
      rdfs:label "Place string" ; 
      sh:property my:LocationPlaceShape
    ]
    [
      rdfs:label "Place shape" ;
      sh:property my:AddressShape ;
    ]
  ) 
.
my:NameShape
  sh:path schema:name ;
  sh:name "Event name";
  sh:datatype xsd:string ;
  dash:singleLine true ;
  sh:maxCount 1 ;
  sh:minLength 1;
  sh:minCount 1 ;
  sh:order 1 ;
#  sh:maxLength 72;
.
my:StartDateShape
  sh:path schema:startDate ;
  sh:datatype xsd:dateTime ;
  sh:minCount 1 ;
  sh:maxCount 1 ;
  sh:name "Start date";
  sh:order 2;
.
my:LocationPlaceShape 
  sh:path schema:location ;
  sh:datatype xsd:string ;
  sh:minCount 1 ;
  sh:maxCount 1 ;
  sh:minLength 4;
  sh:maxLength 72;
  sh:name "Location";
  sh:order 3;
. 
my:PlaceShape
  a sh:NodeShape;
  rdfs:label "Place shape" ;
  sh:property [
    sh:path schema:addressLocality ;
    sh:name "Location" ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ];
  sh:property [
    sh:path schema:label ;
    sh:name "Something" ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ];
.
my:AddressShape 
  sh:path schema:address ;
  sh:node my:PlaceShape ;
  sh:class schema:Place ;
  sh:minCount 1 ;
  sh:maxCount 1 ;
  sh:minLength 4;
  sh:maxLength 72;
  sh:name "Location";
  sh:order 3;
. 
`

export async function parseTTL() {
  const inputStream = stringToStream(xottl)
  const quads = []

  const quadStream = parsers.import('text/turtle', inputStream)
  for await (const quad of quadStream) {
    quads.push(quad)
  }

  return quads;
}
