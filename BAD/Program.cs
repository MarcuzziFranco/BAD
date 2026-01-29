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
        var keysWithTypes = GetAllKeysWithTypes(jsonObject, "").ToList();

        if (keysWithTypes.Count == 0)
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
                    Console.WriteLine($"  - {config.Key}: {config.Value.GetDescription()}");
                }
                ConsoleHelper.WriteSeparator();
            }

            var menuOptions = keysWithTypes.Select(kt =>
            {
                string configInfo = "";
                if (GeneratorJson.DefaultValuesOperations.TryGetValue(kt.Key, out var config))
                {
                    configInfo = $" [{config.GetDescription()}]";
                }
                return $"{kt.Key} ({GetTypeName(kt.Type)}: {GetValuePreview(kt.Value)}){configInfo}";
            }).Concat(new[] { "Limpiar todas las configuraciones", "<< Volver" }).ToArray();

            int selected = ConsoleHelper.ShowMenu("Seleccione una propiedad para configurar", menuOptions);

            if (selected == keysWithTypes.Count + 1)
            {
                return; // Volver
            }

            if (selected == keysWithTypes.Count)
            {
                GeneratorJson.ClearDefaultValues();
                ConsoleHelper.WriteSuccess("Configuraciones limpiadas");
                ConsoleHelper.WaitForKey();
                continue;
            }

            var selectedItem = keysWithTypes[selected];
            ConfigureProperty(selectedItem.Key, selectedItem.Type, selectedItem.Value);
        }
    }

    /// <summary>
    /// Obtiene un nombre legible para el tipo
    /// </summary>
    static string GetTypeName(JTokenType type)
    {
        return type switch
        {
            JTokenType.String => "texto",
            JTokenType.Integer => "entero",
            JTokenType.Float => "decimal",
            JTokenType.Boolean => "booleano",
            JTokenType.Date => "fecha",
            JTokenType.Null => "null",
            JTokenType.Object => "objeto",
            JTokenType.Array => "array",
            _ => type.ToString()
        };
    }

    /// <summary>
    /// Obtiene una vista previa del valor
    /// </summary>
    static string GetValuePreview(JToken value)
    {
        var str = value.ToString();
        if (str.Length > 20)
        {
            return str.Substring(0, 17) + "...";
        }
        return str;
    }

    /// <summary>
    /// Configura una propiedad específica
    /// </summary>
    static void ConfigureProperty(string key, JTokenType type, JToken currentValue)
    {
        Console.Clear();
        ConsoleHelper.WriteHeader($"Configurar: {key}");
        ConsoleHelper.WriteInfo($"Tipo: {GetTypeName(type)}");
        ConsoleHelper.WriteInfo($"Valor actual: {currentValue}");
        ConsoleHelper.WriteSeparator();

        // Construir opciones según el tipo
        var options = new List<string>
        {
            "Reemplazar con valor fijo",
            "Reemplazar con lista de valores (rotativo)"
        };

        // Agregar opción de rango solo para tipos numéricos y fechas
        bool supportsRange = type == JTokenType.Integer || type == JTokenType.Float || type == JTokenType.Date;
        if (supportsRange)
        {
            options.Add($"Generar aleatorio en rango ({GetTypeName(type)})");
        }

        options.AddRange(new[]
        {
            "Forzar NULL",
            "No cambiar (mantener original)",
            "Quitar configuración",
            "<< Volver"
        });

        int opSelected = ConsoleHelper.ShowMenu($"Operación para '{key}'", options.ToArray());

        // Ajustar índice si no soporta rango
        int rangeOptionIndex = supportsRange ? 2 : -1;
        int nullOptionIndex = supportsRange ? 3 : 2;
        int noChangeOptionIndex = supportsRange ? 4 : 3;
        int removeOptionIndex = supportsRange ? 5 : 4;
        int backOptionIndex = supportsRange ? 6 : 5;

        if (opSelected == 0) // Valor fijo
        {
            Console.Clear();
            ConsoleHelper.WriteInfo($"Tipo original: {GetTypeName(type)}");
            string value = ConsoleHelper.GetStringInput($"Ingrese el valor para '{key}'");
            
            var configValue = ConvertValueToType(value, type);
            GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = type,
                Value = configValue
            });
            ConsoleHelper.WriteSuccess($"Configurado: {key} = {configValue}");
        }
        else if (opSelected == 1) // Lista de valores
        {
            Console.Clear();
            ConsoleHelper.WriteInfo($"Tipo original: {GetTypeName(type)}");
            Console.WriteLine("Ingrese los valores separados por coma:");
            string? valuesInput = Console.ReadLine();
            if (!string.IsNullOrEmpty(valuesInput))
            {
                var values = valuesInput.Split(',')
                    .Select(v => ConvertValueToType(v.Trim(), type))
                    .ToArray();
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = JTokenType.Array,
                    Value = values
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} rotará entre {values.Length} valores");
            }
        }
        else if (supportsRange && opSelected == rangeOptionIndex) // Rango
        {
            Console.Clear();
            ConsoleHelper.WriteInfo($"Configurar rango para {GetTypeName(type)}");
            
            if (type == JTokenType.Integer)
            {
                int min = ConsoleHelper.GetIntInput("Valor mínimo", int.MinValue, int.MaxValue, 0);
                int max = ConsoleHelper.GetIntInput("Valor máximo", min, int.MaxValue, 100);
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.RandomRange,
                    TypeDefault = type,
                    MinValue = min,
                    MaxValue = max
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} aleatorio entre {min} y {max}");
            }
            else if (type == JTokenType.Float)
            {
                Console.Write("Valor mínimo [0]: ");
                float min = float.TryParse(Console.ReadLine(), out var minVal) ? minVal : 0;
                Console.Write($"Valor máximo [{min + 100}]: ");
                float max = float.TryParse(Console.ReadLine(), out var maxVal) ? maxVal : min + 100;
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.RandomRange,
                    TypeDefault = type,
                    MinValue = min,
                    MaxValue = max
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} aleatorio entre {min} y {max}");
            }
            else if (type == JTokenType.Date)
            {
                string minDate = ConsoleHelper.GetStringInput("Fecha mínima (yyyy-MM-dd)", "2020-01-01");
                string maxDate = ConsoleHelper.GetStringInput("Fecha máxima (yyyy-MM-dd)", "2024-12-31");
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.RandomRange,
                    TypeDefault = type,
                    MinValue = minDate,
                    MaxValue = maxDate
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} aleatorio entre {minDate} y {maxDate}");
            }
        }
        else if (opSelected == nullOptionIndex) // Forzar NULL
        {
            GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
            {
                Operation = EnumOperations.ForceNull
            });
            ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
        }
        else if (opSelected == noChangeOptionIndex) // No cambiar
        {
            GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
            {
                Operation = EnumOperations.NotChange
            });
            ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá su valor original");
        }
        else if (opSelected == removeOptionIndex) // Quitar
        {
            if (GeneratorJson.DefaultValuesOperations.Remove(key))
            {
                ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
            }
        }
        else if (opSelected == backOptionIndex) // Volver
        {
            return;
        }

        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Convierte un string al tipo apropiado
    /// </summary>
    static object ConvertValueToType(string value, JTokenType type)
    {
        try
        {
            return type switch
            {
                JTokenType.Integer => int.Parse(value),
                JTokenType.Float => float.Parse(value),
                JTokenType.Boolean => bool.Parse(value),
                _ => value
            };
        }
        catch
        {
            return value;
        }
    }

    /// <summary>
    /// Obtiene todas las keys de un JSON con su tipo y valor (incluyendo anidadas)
    /// </summary>
    static IEnumerable<(string Key, JTokenType Type, JToken Value)> GetAllKeysWithTypes(JObject obj, string prefix)
    {
        foreach (var property in obj.Properties())
        {
            string fullPath = string.IsNullOrEmpty(prefix) ? property.Name : $"{prefix}.{property.Name}";

            if (property.Value is JObject nestedObj)
            {
                foreach (var nestedItem in GetAllKeysWithTypes(nestedObj, fullPath))
                {
                    yield return nestedItem;
                }
            }
            else if (property.Value is JArray array && array.Count > 0 && array[0] is JObject)
            {
                // Para arrays de objetos, mostrar las propiedades del primer elemento
                foreach (var arrayItem in GetAllKeysWithTypes((JObject)array[0], $"{fullPath}[0]"))
                {
                    yield return arrayItem;
                }
            }
            else
            {
                var valueType = Analyzer.GetType(property.Value);
                yield return (fullPath, valueType, property.Value);
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
