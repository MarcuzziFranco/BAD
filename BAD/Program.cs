/***
 * Brutality Api Destroyed
 * 1-Read Json simple model (one level) X
 * 2-Generate new Json other values (equal values) X
 * 3-Generate new Json other values differents values (equals types) X
 * ***/

using BAD.Generator;
using BAD.JsonReader;


string pathJson = "C:\\Users\\Franc\\PERSONAL\\NET\\BAD\\BAD\\jsonfiles\\test1.json";
int count = 5;

var json = File.ReadAllText(pathJson);

List<dynamic> listJsonGenerate = new List<dynamic>();
Analyzer analyzer = new Analyzer(json);

//analyzer.PrintListValues();
//analyzer.PrintListValuesType();
//analyzer.PrintListKeys();

//Generate news json
for (int i = 0; i < count; i++)
{
    listJsonGenerate.Add(GeneratorJson.GeneratorJsonValues(json));
}

//Print new listjson
foreach (var item in listJsonGenerate)
{
    Console.WriteLine(item);
}








