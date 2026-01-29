/***
* Brutality Api Destroyed
* Herramienta para generar combinaciones de JSON y testear endpoints
* 
* Funcionalidades implementadas:
* 1- Leer JSON simple y multinivel ✔️
* 2- Generar JSONs con valores aleatorios ✔️
* 3- Soporte para UUID, float, int, bool, date ✔️
* 4- Configurar valores por defecto ✔️
* 5- Ejecutar requests GET/POST masivos ✔️
* 6- Guardar resultados de ejecución ✔️
* 7- Menú de consola interactivo ✔️
***/

using BAD.ConsoleUI;
using BAD.Generator;
using BAD.Generator.Configurations;
using BAD.JsonReader;
using BAD.Models;
using BAD.Services;
using Newtonsoft.Json.Linq;

namespace BAD;

class Program
{
    private static readonly AppState _state = new();
    private static readonly ResultStorage _storage = new();
    private static readonly string _jsonFilesPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "jsonfiles");

    static async Task Main(string[] args)
    {
        Console.Title = "BAD - Brutality Api Destroyed";

        while (true)
        {
            var mainOptions = new[]
            {
                "1. Seleccionar archivo JSON base",
                "2. Configurar valores por defecto",
                "3. Definir cantidad a generar",
                "4. Definir formato de salida",
                "5. Generar JSONs",
                "6. Ejecutar contra endpoint",
                "7. Ver estado actual",
                "8. Salir"
            };

            int selection = ConsoleHelper.ShowMenu("BAD - Generador de JSON para Testing", mainOptions);

            switch (selection)
            {
                case 0:
                    SelectJsonFile();
                    break;
                case 1:
                    ConfigureDefaults();
                    break;
                case 2:
                    SetGenerateCount();
                    break;
                case 3:
                    SetOutputFormat();
                    break;
                case 4:
                    GenerateJsons();
                    break;
                case 5:
                    await ExecuteAgainstEndpoint();
                    break;
                case 6:
                    ShowCurrentState();
                    break;
                case 7:
                    if (ConsoleHelper.Confirm("¿Está seguro que desea salir?"))
                    {
                        ConsoleHelper.WriteInfo("¡Hasta luego!");
                        return;
                    }
                    break;
            }
        }
    }

    /// <summary>
    /// Opción 1: Seleccionar archivo JSON base
    /// </summary>
    static void SelectJsonFile()
    {
        Console.Clear();
        ConsoleHelper.WriteHeader("Seleccionar archivo JSON base");

        // Buscar archivos JSON
        string searchPath = Directory.Exists(_jsonFilesPath) ? _jsonFilesPath : AppDomain.CurrentDomain.BaseDirectory;
        var jsonFiles = Directory.GetFiles(searchPath, "*.json", SearchOption.AllDirectories);

        if (jsonFiles.Length == 0)
        {
            ConsoleHelper.WriteWarning($"No se encontraron archivos JSON en: {searchPath}");
            ConsoleHelper.WriteInfo("Puede colocar archivos JSON en la carpeta 'jsonfiles'");
            ConsoleHelper.WaitForKey();
            return;
        }

        // Mostrar menú de archivos
        var fileOptions = jsonFiles.Select(f => Path.GetFileName(f)).ToArray();
        var optionsWithBack = fileOptions.Concat(new[] { "<< Volver" }).ToArray();

        int selected = ConsoleHelper.ShowMenu("Seleccione un archivo JSON", optionsWithBack);

        if (selected == fileOptions.Length)
        {
            return; // Volver
        }

        string selectedPath = jsonFiles[selected];

        try
        {
            string content = File.ReadAllText(selectedPath);

            // Validar que es JSON válido
            JObject.Parse(content);

            _state.SelectedJsonPath = selectedPath;
            _state.JsonContent = content;

            GeneratorJson.ClearDefaultValues();
            _state.ClearGeneratedJsons();

            Console.Clear();
            ConsoleHelper.WriteSuccess($"Archivo cargado: {_state.FileName}");
            ConsoleHelper.WriteSeparator();
            ConsoleHelper.WriteInfo("Contenido del JSON:");
            ConsoleHelper.WriteJson(content);
            ConsoleHelper.WaitForKey();
        }
        catch (Exception ex)
        {
            ConsoleHelper.WriteError($"Error al cargar el archivo: {ex.Message}");
            ConsoleHelper.WaitForKey();
        }
    }

    /// <summary>
    /// Opción 2: Configurar valores por defecto
    /// </summary>
    static void ConfigureDefaults()
    {
        if (!_state.HasJsonLoaded)
        {
            ConsoleHelper.WriteWarning("Primero debe seleccionar un archivo JSON base");
            ConsoleHelper.WaitForKey();
            return;
        }

        Console.Clear();
        ConsoleHelper.WriteHeader("Configurar valores por defecto");

        var jsonObject = JObject.Parse(_state.JsonContent!);
        var keys = GetAllKeys(jsonObject, "").ToList();

        if (keys.Count == 0)
        {
            ConsoleHelper.WriteWarning("El JSON no tiene propiedades configurables");
            ConsoleHelper.WaitForKey();
            return;
        }

        while (true)
        {
            Console.Clear();
            ConsoleHelper.WriteHeader("Configurar valores por defecto");

            // Mostrar configuraciones actuales
            if (GeneratorJson.DefaultValuesOperations.Count > 0)
            {
                ConsoleHelper.WriteInfo("Configuraciones actuales:");
                foreach (var config in GeneratorJson.DefaultValuesOperations)
                {
                    Console.WriteLine($"  - {config.Key}: {config.Value.Operation} = {config.Value.Value}");
                }
                ConsoleHelper.WriteSeparator();
            }

            var menuOptions = keys.Select(k =>
            {
                var hasConfig = GeneratorJson.DefaultValuesOperations.ContainsKey(k) ? " [configurado]" : "";
                return $"{k}{hasConfig}";
            }).Concat(new[] { "Limpiar todas las configuraciones", "<< Volver" }).ToArray();

            int selected = ConsoleHelper.ShowMenu("Seleccione una propiedad para configurar", menuOptions);

            if (selected == keys.Count + 1)
            {
                return; // Volver
            }

            if (selected == keys.Count)
            {
                GeneratorJson.ClearDefaultValues();
                ConsoleHelper.WriteSuccess("Configuraciones limpiadas");
                ConsoleHelper.WaitForKey();
                continue;
            }

            ConfigureProperty(keys[selected]);
        }
    }

    /// <summary>
    /// Configura una propiedad específica
    /// </summary>
    static void ConfigureProperty(string key)
    {
        Console.Clear();
        ConsoleHelper.WriteHeader($"Configurar: {key}");

        var operationOptions = new[]
        {
            "Reemplazar con valor fijo",
            "Reemplazar con lista de valores (rotativo)",
            "Forzar NULL",
            "No cambiar (mantener original)",
            "Quitar configuración",
            "<< Volver"
        };

        int opSelected = ConsoleHelper.ShowMenu($"Operación para '{key}'", operationOptions);

        switch (opSelected)
        {
            case 0: // Valor fijo
                Console.Clear();
                string value = ConsoleHelper.GetStringInput($"Ingrese el valor para '{key}'");
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    Value = value
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = {value}");
                break;

            case 1: // Lista de valores
                Console.Clear();
                Console.WriteLine("Ingrese los valores separados por coma:");
                string? valuesInput = Console.ReadLine();
                if (!string.IsNullOrEmpty(valuesInput))
                {
                    var values = valuesInput.Split(',').Select(v => v.Trim()).ToArray();
                    GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                    {
                        Operation = EnumOperations.Replace,
                        TypeDefault = JTokenType.Array,
                        Value = values
                    });
                    ConsoleHelper.WriteSuccess($"Configurado: {key} rotará entre {values.Length} valores");
                }
                break;

            case 2: // Forzar NULL
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.ForceNull
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
                break;

            case 3: // No cambiar
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.NotChange
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá su valor original");
                break;

            case 4: // Quitar
                if (GeneratorJson.DefaultValuesOperations.Remove(key))
                {
                    ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
                }
                break;

            case 5: // Volver
                return;
        }

        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Obtiene todas las keys de un JSON (incluyendo anidadas)
    /// </summary>
    static IEnumerable<string> GetAllKeys(JObject obj, string prefix)
    {
        foreach (var property in obj.Properties())
        {
            string fullPath = string.IsNullOrEmpty(prefix) ? property.Name : $"{prefix}.{property.Name}";

            if (property.Value is JObject nestedObj)
            {
                foreach (var nestedKey in GetAllKeys(nestedObj, fullPath))
                {
                    yield return nestedKey;
                }
            }
            else if (property.Value is JArray array && array.Count > 0 && array[0] is JObject)
            {
                // Para arrays de objetos, mostrar las propiedades del primer elemento
                foreach (var arrayKey in GetAllKeys((JObject)array[0], $"{fullPath}[0]"))
                {
                    yield return arrayKey;
                }
            }
            else
            {
                yield return fullPath;
            }
        }
    }

    /// <summary>
    /// Opción 3: Definir cantidad a generar
    /// </summary>
    static void SetGenerateCount()
    {
        Console.Clear();
        ConsoleHelper.WriteHeader("Definir cantidad a generar");

        ConsoleHelper.WriteInfo($"Cantidad actual: {_state.GenerateCount}");
        Console.WriteLine();

        _state.GenerateCount = ConsoleHelper.GetIntInput("Nueva cantidad", 1, 1000, _state.GenerateCount);

        ConsoleHelper.WriteSuccess($"Cantidad configurada: {_state.GenerateCount}");
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Opción 4: Definir formato de salida
    /// </summary>
    static void SetOutputFormat()
    {
        Console.Clear();
        ConsoleHelper.WriteHeader("Definir formato de salida");

        var formatOptions = new[]
        {
            "Solo mostrar en consola",
            "Guardar cada JSON en archivo separado",
            "Guardar todos los JSONs en un solo archivo"
        };

        int selected = ConsoleHelper.ShowMenu("Seleccione el formato de salida", formatOptions);

        _state.OutputFormat = selected switch
        {
            0 => OutputFormat.Console,
            1 => OutputFormat.MultipleFiles,
            2 => OutputFormat.SingleFile,
            _ => OutputFormat.Console
        };

        ConsoleHelper.WriteSuccess($"Formato configurado: {_state.OutputFormat}");
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Opción 5: Generar JSONs
    /// </summary>
    static void GenerateJsons()
    {
        if (!_state.HasJsonLoaded)
        {
            ConsoleHelper.WriteWarning("Primero debe seleccionar un archivo JSON base");
            ConsoleHelper.WaitForKey();
            return;
        }

        Console.Clear();
        ConsoleHelper.WriteHeader("Generando JSONs");

        ConsoleHelper.WriteInfo($"Generando {_state.GenerateCount} JSONs basados en {_state.FileName}...");
        Console.WriteLine();

        try
        {
            _state.GeneratedJsons = GeneratorJson.GenerateMultiple(_state.JsonContent!, _state.GenerateCount);

            ConsoleHelper.WriteSuccess($"Se generaron {_state.GeneratedJsons.Count} JSONs exitosamente");
            ConsoleHelper.WriteSeparator();

            // Mostrar según formato
            if (_state.OutputFormat == OutputFormat.Console)
            {
                for (int i = 0; i < _state.GeneratedJsons.Count; i++)
                {
                    ConsoleHelper.WriteInfo($"JSON #{i + 1}:");
                    ConsoleHelper.WriteJson(_state.GeneratedJsons[i]);
                    Console.WriteLine();
                }
            }
            else
            {
                // Guardar en archivos
                string outputPath = _storage.SaveGeneratedJsons(
                    _state.GeneratedJsons,
                    _state.FileName!,
                    _state.OutputFormat);

                ConsoleHelper.WriteSuccess($"JSONs guardados en: {outputPath}");

                // Mostrar preview
                ConsoleHelper.WriteInfo("Preview del primer JSON generado:");
                ConsoleHelper.WriteJson(_state.GeneratedJsons[0]);
            }
        }
        catch (Exception ex)
        {
            ConsoleHelper.WriteError($"Error al generar JSONs: {ex.Message}");
        }

        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Opción 6: Ejecutar contra endpoint
    /// </summary>
    static async Task ExecuteAgainstEndpoint()
    {
        if (!_state.HasGeneratedJsons)
        {
            ConsoleHelper.WriteWarning("Primero debe generar los JSONs (opción 5)");
            ConsoleHelper.WaitForKey();
            return;
        }

        Console.Clear();
        ConsoleHelper.WriteHeader("Ejecutar contra endpoint");

        // Configurar URL
        _state.EndpointUrl = ConsoleHelper.GetStringInput(
            "URL del endpoint",
            _state.EndpointUrl ?? "https://jsonplaceholder.typicode.com/posts");

        // Seleccionar método HTTP
        var methodOptions = Enum.GetNames(typeof(HttpMethodType));
        int methodSelected = ConsoleHelper.ShowMenu("Seleccione el método HTTP", methodOptions);
        _state.HttpMethod = (HttpMethodType)methodSelected;

        Console.Clear();
        ConsoleHelper.WriteHeader("Ejecutar contra endpoint");
        ConsoleHelper.WriteInfo($"URL: {_state.EndpointUrl}");
        ConsoleHelper.WriteInfo($"Método: {_state.HttpMethod}");
        ConsoleHelper.WriteInfo($"Requests a ejecutar: {_state.GeneratedJsons.Count}");
        Console.WriteLine();

        if (!ConsoleHelper.Confirm("¿Desea continuar con la ejecución?"))
        {
            return;
        }

        Console.WriteLine();

        var executor = new RequestExecutor();
        executor.OnRequestCompleted += (current, total, success) =>
        {
            string status = success ? "OK" : "FAIL";
            ConsoleHelper.ShowProgress(current, total, status);
        };

        try
        {
            ConsoleHelper.WriteInfo("Ejecutando requests...");
            Console.WriteLine();

            var results = await executor.ExecuteBatchAsync(
                _state.EndpointUrl!,
                _state.HttpMethod,
                _state.GeneratedJsons);

            Console.WriteLine();

            // Generar resumen
            var summary = ExecutionSummary.FromResults(
                results,
                _state.FileName!,
                _state.EndpointUrl!,
                _state.HttpMethod.ToString());

            // Mostrar resumen
            ConsoleHelper.WriteSuccess(summary.ToString());

            // Guardar resultados
            string outputPath = _storage.SaveExecutionResults(results, summary, _state.FileName!);
            ConsoleHelper.WriteSuccess($"Resultados guardados en: {outputPath}");
        }
        catch (Exception ex)
        {
            ConsoleHelper.WriteError($"Error durante la ejecución: {ex.Message}");
        }

        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Opción 7: Ver estado actual
    /// </summary>
    static void ShowCurrentState()
    {
        Console.Clear();
        ConsoleHelper.WriteHeader("Estado actual de la aplicación");

        if (_state.HasJsonLoaded)
        {
            ConsoleHelper.WriteInfo($"Archivo seleccionado: {_state.FileName}");
            ConsoleHelper.WriteInfo($"Ruta: {_state.SelectedJsonPath}");
        }
        else
        {
            ConsoleHelper.WriteWarning("No hay archivo JSON seleccionado");
        }

        ConsoleHelper.WriteSeparator();

        ConsoleHelper.WriteInfo($"Cantidad a generar: {_state.GenerateCount}");
        ConsoleHelper.WriteInfo($"Formato de salida: {_state.OutputFormat}");

        if (_state.HasGeneratedJsons)
        {
            ConsoleHelper.WriteInfo($"JSONs generados: {_state.GeneratedJsons.Count}");
        }

        ConsoleHelper.WriteSeparator();

        // Mostrar configuración del generador
        var config = _state.GeneratorConfig;
        ConsoleHelper.WriteInfo("Configuración de rangos:");
        Console.WriteLine($"  - Integers: {config.IntegerMin} - {config.IntegerMax}");
        Console.WriteLine($"  - Floats: {config.FloatMin} - {config.FloatMax} ({config.FloatDecimals} decimales)");
        Console.WriteLine($"  - Strings: {config.StringLength} caracteres");
        Console.WriteLine($"  - Fechas: {config.DateMin} a {config.DateMax}");

        if (GeneratorJson.DefaultValuesOperations.Count > 0)
        {
            ConsoleHelper.WriteSeparator();
            ConsoleHelper.WriteInfo("Valores por defecto configurados:");
            foreach (var kvp in GeneratorJson.DefaultValuesOperations)
            {
                Console.WriteLine($"  - {kvp.Key}: {kvp.Value.Operation}");
            }
        }

        if (!string.IsNullOrEmpty(_state.EndpointUrl))
        {
            ConsoleHelper.WriteSeparator();
            ConsoleHelper.WriteInfo($"Endpoint: {_state.HttpMethod} {_state.EndpointUrl}");
        }

        ConsoleHelper.WaitForKey();
    }
}
