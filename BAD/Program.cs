/***
* Brutality Api Destroyed
* 1- Read a simple Json model (one level). ✔️
* 2- Generate a new Json with equal values. ✔️
* 3- Generate a new Json with different values (same types). ✔️
* 4- Validate UUID and generate a value. ✔️
* 5- Validate a floating-point number (float) and generate a random value.✔️
* 6- Read a Json with multiple-level objects. ✔️
* 7- Read a Json with an array object and generate values. ✔️
* 8- Read a Json from a CSV file with only values.                                      !!!Low priority!!!
* 9- Be able to determine which values change and which do not by a CSV file.           !!!Low priority!!!
* 10- Execute a GET request towards a service with a generated Json (one case). ✔️
* 11- Execute GET requests towards a service with multiple generated Json.
* 12- Save the result of the request and the service response.
* 13- Generate a request using CURL and load a Json.                                    !!!Low priority!!!
* 14- Generate a new json with null value. ✔️ (support in feat 15)
* 15- Generate a new json with default value. ✔️
* 16- Setting diccionary with default value  ✔️
* 17- Execute POST request towards a services with a generate Json 
* 18- Generate a new json by setting a list of values ​​for a specific key  ✔️
 * ***/

using BAD.Generator;
using BAD.Generator.Configurations;
using BAD.JsonReader;
using Newtonsoft.Json.Linq;

string pathJson = "C:\\Users\\Franc\\PERSONAL\\NET\\BAD\\BAD\\jsonfiles\\test3.json";
int count = 6;

var json = File.ReadAllText(pathJson);

List<dynamic> listJsonGenerate = new List<dynamic>();
Analyzer analyzer = new Analyzer(json);


#region add list values for key json
var idsUser = new int[6] { 1, 2, 4, 5, 6, 7 };
GeneratorJson.AddNewDefaultValue("userId", new DefaultValueConfig { Value = idsUser, TypeDefault = JTokenType.Array });
#endregion
//Generate news json
for (int i = 0; i < count; i++)
{
    listJsonGenerate.Add(GeneratorJson.GeneratorJsonValues(json));
}

//Print new listjson
foreach (var item in listJsonGenerate)
{
    Console.WriteLine(item);
    // dynamic response = await ExternalResources.PostAsync<dynamic, dynamic>("https://jsonplaceholder.typicode.com/posts", item);
    // Console.WriteLine(response);
}








