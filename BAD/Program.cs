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
* 8- Presets de mutación ✔️
***/

using BAD.ConsoleUI;
using BAD.Generator;
using BAD.Generator.Configurations;
using BAD.JsonReader;
using BAD.Models;
using BAD.Presets;
using BAD.Services;
using Newtonsoft.Json.Linq;

namespace BAD;

class Program
{
    private static readonly AppState _state = new();
    private static readonly ResultStorage _storage = new();
    private static readonly PresetManager _presetManager = new();
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
                "3. Aplicar preset de mutación",
                "4. Definir cantidad a generar",
                "5. Definir formato de salida",
                "6. Generar JSONs",
                "7. Ejecutar contra endpoint",
                "8. Ver estado actual",
                "9. Salir"
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
                    ApplyPreset();
                    break;
                case 3:
                    SetGenerateCount();
                    break;
                case 4:
                    SetOutputFormat();
                    break;
                case 5:
                    GenerateJsons();
                    break;
                case 6:
                    await ExecuteAgainstEndpoint();
                    break;
                case 7:
                    ShowCurrentState();
                    break;
                case 8:
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
    /// Opción 3: Aplicar preset de mutación
    /// </summary>
    static void ApplyPreset()
    {
        if (!_state.HasJsonLoaded)
        {
            ConsoleHelper.WriteWarning("Primero debe seleccionar un archivo JSON base");
            ConsoleHelper.WaitForKey();
            return;
        }

        Console.Clear();
        ConsoleHelper.WriteHeader("Aplicar Preset de Mutación");
        ConsoleHelper.WriteInfo("Los presets aplican configuraciones masivas a todos los campos del JSON");
        ConsoleHelper.WriteSeparator();

        // Obtener presets agrupados por categoría
        var groupedPresets = _presetManager.GetPresetsGroupedByCategory();
        var allPresets = _presetManager.GetAllPresets();

        // Construir opciones del menú
        var menuOptions = new List<string>();
        
        foreach (var group in groupedPresets)
        {
            menuOptions.Add($"--- {group.Category} ---");
            foreach (var preset in group.Presets)
            {
                menuOptions.Add($"  {preset.Name}: {preset.Description}");
            }
        }
        menuOptions.Add("<< Volver");

        int selected = ConsoleHelper.ShowMenu("Seleccione un preset", menuOptions.ToArray());

        // Si seleccionó volver
        if (selected == menuOptions.Count - 1)
        {
            return;
        }

        // Encontrar el preset seleccionado (saltando los separadores de categoría)
        int presetIndex = 0;
        int currentMenuIndex = 0;
        IPreset? selectedPreset = null;

        foreach (var group in groupedPresets)
        {
            currentMenuIndex++; // Saltar el separador de categoría
            foreach (var preset in group.Presets)
            {
                if (currentMenuIndex == selected)
                {
                    selectedPreset = preset;
                    break;
                }
                currentMenuIndex++;
                presetIndex++;
            }
            if (selectedPreset != null) break;
        }

        if (selectedPreset == null)
        {
            return;
        }

        // Confirmar aplicación
        Console.Clear();
        ConsoleHelper.WriteHeader($"Preset: {selectedPreset.Name}");
        ConsoleHelper.WriteInfo($"Descripción: {selectedPreset.Description}");
        ConsoleHelper.WriteInfo($"Categoría: {selectedPreset.Category}");
        ConsoleHelper.WriteSeparator();
        ConsoleHelper.WriteWarning("Esto reemplazará todas las configuraciones actuales.");

        if (!ConsoleHelper.Confirm("¿Desea aplicar este preset?"))
        {
            return;
        }

        try
        {
            var jsonObject = JObject.Parse(_state.JsonContent!);
            _presetManager.ApplyPreset(selectedPreset, jsonObject);

            // Limpiar JSONs generados anteriormente
            _state.ClearGeneratedJsons();

            Console.Clear();
            ConsoleHelper.WriteSuccess($"Preset '{selectedPreset.Name}' aplicado correctamente");
            ConsoleHelper.WriteSeparator();

            // Mostrar configuraciones aplicadas
            if (GeneratorJson.DefaultValuesOperations.Count > 0)
            {
                ConsoleHelper.WriteInfo($"Se configuraron {GeneratorJson.DefaultValuesOperations.Count} campos:");
                int count = 0;
                foreach (var config in GeneratorJson.DefaultValuesOperations.Take(10))
                {
                    Console.WriteLine($"  - {config.Key}: {config.Value.GetDescription()}");
                    count++;
                }
                if (GeneratorJson.DefaultValuesOperations.Count > 10)
                {
                    Console.WriteLine($"  ... y {GeneratorJson.DefaultValuesOperations.Count - 10} más");
                }
            }
            else
            {
                ConsoleHelper.WriteInfo("Preset aplicado (modo aleatorio - sin configuraciones fijas)");
            }
        }
        catch (Exception ex)
        {
            ConsoleHelper.WriteError($"Error al aplicar preset: {ex.Message}");
        }

        ConsoleHelper.WaitForKey();
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
            JTokenType.Guid => "GUID",
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

        // Mostrar menú según el tipo
        switch (type)
        {
            case JTokenType.Boolean:
                ConfigureBoolean(key);
                break;
            case JTokenType.Guid:
                ConfigureGuid(key, currentValue.ToString());
                break;
            case JTokenType.Integer:
            case JTokenType.Float:
                ConfigureNumeric(key, type);
                break;
            case JTokenType.Date:
                ConfigureDate(key);
                break;
            default:
                ConfigureGeneric(key, type);
                break;
        }
    }

    /// <summary>
    /// Configuración para valores booleanos
    /// </summary>
    static void ConfigureBoolean(string key)
    {
        var options = new[]
        {
            "Aleatorio (true/false)",
            "Forzar TRUE",
            "Forzar FALSE",
            "Lista de valores (rotativo)",
            "No cambiar (mantener original)",
            "Forzar NULL",
            "Quitar configuración",
            "<< Volver"
        };

        int selected = ConsoleHelper.ShowMenu($"Configurar booleano '{key}'", options);

        switch (selected)
        {
            case 0: // Aleatorio
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configurado: {key} será aleatorio (true/false)");
                break;
            case 1: // TRUE
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = JTokenType.Boolean,
                    Value = true
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = TRUE");
                break;
            case 2: // FALSE
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = JTokenType.Boolean,
                    Value = false
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = FALSE");
                break;
            case 3: // Lista
                ConfigureListValues(key, JTokenType.Boolean);
                return; // Ya mostró mensaje
            case 4: // No cambiar
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.NotChange
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá su valor original");
                break;
            case 5: // NULL
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.ForceNull
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
                break;
            case 6: // Quitar
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
                break;
            case 7: // Volver
                return;
        }
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Configuración para GUIDs
    /// </summary>
    static void ConfigureGuid(string key, string currentGuid)
    {
        var options = new[]
        {
            "Generar nuevo GUID aleatorio",
            "Mantener GUID original",
            "Valor GUID fijo",
            "Lista de GUIDs (rotativo)",
            "Forzar NULL",
            "Quitar configuración",
            "<< Volver"
        };

        int selected = ConsoleHelper.ShowMenu($"Configurar GUID '{key}'", options);

        switch (selected)
        {
            case 0: // Nuevo aleatorio
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configurado: {key} generará un nuevo GUID cada vez");
                break;
            case 1: // Mantener original
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.NotChange
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá el GUID original ({currentGuid})");
                break;
            case 2: // GUID fijo
                Console.Clear();
                string guid = ConsoleHelper.GetStringInput("Ingrese el GUID", Guid.NewGuid().ToString());
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = JTokenType.Guid,
                    Value = guid
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = {guid}");
                break;
            case 3: // Lista de GUIDs
                Console.Clear();
                ConsoleHelper.WriteInfo("Ingrese los GUIDs separados por coma (o deje vacío para generar automáticamente):");
                Console.WriteLine("Cantidad de GUIDs a generar automáticamente [5]:");
                string? input = Console.ReadLine();
                
                string[] guids;
                if (int.TryParse(input, out int count) && count > 0)
                {
                    guids = Enumerable.Range(0, count).Select(_ => Guid.NewGuid().ToString()).ToArray();
                }
                else if (!string.IsNullOrEmpty(input))
                {
                    guids = input.Split(',').Select(g => g.Trim()).ToArray();
                }
                else
                {
                    guids = Enumerable.Range(0, 5).Select(_ => Guid.NewGuid().ToString()).ToArray();
                }
                
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = JTokenType.Array,
                    Value = guids
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} rotará entre {guids.Length} GUIDs");
                break;
            case 4: // NULL
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.ForceNull
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
                break;
            case 5: // Quitar
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
                break;
            case 6: // Volver
                return;
        }
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Configuración para valores numéricos (enteros y decimales)
    /// </summary>
    static void ConfigureNumeric(string key, JTokenType type)
    {
        string typeName = GetTypeName(type);
        var options = new[]
        {
            "Aleatorio en rango",
            "Valor fijo",
            "Lista de valores (rotativo)",
            "No cambiar (mantener original)",
            "Forzar NULL",
            "Quitar configuración",
            "<< Volver"
        };

        int selected = ConsoleHelper.ShowMenu($"Configurar {typeName} '{key}'", options);

        switch (selected)
        {
            case 0: // Rango
                Console.Clear();
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
                else // Float
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
                break;
            case 1: // Valor fijo
                Console.Clear();
                string value = ConsoleHelper.GetStringInput($"Ingrese el valor {typeName}");
                var configValue = ConvertValueToType(value, type);
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = type,
                    Value = configValue
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = {configValue}");
                break;
            case 2: // Lista
                ConfigureListValues(key, type);
                return;
            case 3: // No cambiar
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.NotChange
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá su valor original");
                break;
            case 4: // NULL
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.ForceNull
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
                break;
            case 5: // Quitar
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
                break;
            case 6: // Volver
                return;
        }
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Configuración para fechas
    /// </summary>
    static void ConfigureDate(string key)
    {
        var options = new[]
        {
            "Aleatorio en rango de fechas",
            "Fecha fija",
            "Lista de fechas (rotativo)",
            "No cambiar (mantener original)",
            "Forzar NULL",
            "Quitar configuración",
            "<< Volver"
        };

        int selected = ConsoleHelper.ShowMenu($"Configurar fecha '{key}'", options);

        switch (selected)
        {
            case 0: // Rango
                Console.Clear();
                string minDate = ConsoleHelper.GetStringInput("Fecha mínima (yyyy-MM-dd)", "2020-01-01");
                string maxDate = ConsoleHelper.GetStringInput("Fecha máxima (yyyy-MM-dd)", "2024-12-31");
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.RandomRange,
                    TypeDefault = JTokenType.Date,
                    MinValue = minDate,
                    MaxValue = maxDate
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} aleatorio entre {minDate} y {maxDate}");
                break;
            case 1: // Fecha fija
                Console.Clear();
                string date = ConsoleHelper.GetStringInput("Ingrese la fecha (yyyy-MM-dd)", DateTime.Now.ToString("yyyy-MM-dd"));
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = JTokenType.Date,
                    Value = date
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = {date}");
                break;
            case 2: // Lista
                ConfigureListValues(key, JTokenType.Date);
                return;
            case 3: // No cambiar
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.NotChange
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá su valor original");
                break;
            case 4: // NULL
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.ForceNull
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
                break;
            case 5: // Quitar
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
                break;
            case 6: // Volver
                return;
        }
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Configuración genérica para otros tipos (strings, etc.)
    /// </summary>
    static void ConfigureGeneric(string key, JTokenType type)
    {
        var options = new[]
        {
            "Valor fijo",
            "Lista de valores (rotativo)",
            "No cambiar (mantener original)",
            "Forzar NULL",
            "Quitar configuración",
            "<< Volver"
        };

        int selected = ConsoleHelper.ShowMenu($"Configurar '{key}'", options);

        switch (selected)
        {
            case 0: // Valor fijo
                Console.Clear();
                string value = ConsoleHelper.GetStringInput($"Ingrese el valor");
                var configValue = ConvertValueToType(value, type);
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.Replace,
                    TypeDefault = type,
                    Value = configValue
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = {configValue}");
                break;
            case 1: // Lista
                ConfigureListValues(key, type);
                return;
            case 2: // No cambiar
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.NotChange
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} mantendrá su valor original");
                break;
            case 3: // NULL
                GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
                {
                    Operation = EnumOperations.ForceNull
                });
                ConsoleHelper.WriteSuccess($"Configurado: {key} = NULL");
                break;
            case 4: // Quitar
                GeneratorJson.DefaultValuesOperations.Remove(key);
                ConsoleHelper.WriteSuccess($"Configuración eliminada para: {key}");
                break;
            case 5: // Volver
                return;
        }
        ConsoleHelper.WaitForKey();
    }

    /// <summary>
    /// Configuración de lista de valores con opción de conversión de tipo
    /// </summary>
    static void ConfigureListValues(string key, JTokenType originalType)
    {
        Console.Clear();
        ConsoleHelper.WriteHeader($"Lista de valores para '{key}'");
        ConsoleHelper.WriteInfo($"Tipo original: {GetTypeName(originalType)}");
        ConsoleHelper.WriteSeparator();

        // Preguntar si quiere convertir el tipo
        var typeOptions = new[]
        {
            $"Mantener tipo ({GetTypeName(originalType)})",
            "Convertir a texto (string)",
            "Convertir a entero (int)",
            "Convertir a decimal (float)",
            "Convertir a booleano (bool)",
            "<< Volver"
        };

        int typeSelected = ConsoleHelper.ShowMenu("Seleccione el tipo de los valores", typeOptions);
        
        if (typeSelected == 5) return;

        JTokenType targetType = typeSelected switch
        {
            0 => originalType,
            1 => JTokenType.String,
            2 => JTokenType.Integer,
            3 => JTokenType.Float,
            4 => JTokenType.Boolean,
            _ => originalType
        };

        Console.Clear();
        ConsoleHelper.WriteInfo($"Tipo de valores: {GetTypeName(targetType)}");
        Console.WriteLine("Ingrese los valores separados por coma:");
        string? valuesInput = Console.ReadLine();

        if (!string.IsNullOrEmpty(valuesInput))
        {
            var values = valuesInput.Split(',')
                .Select(v => ConvertValueToType(v.Trim(), targetType))
                .ToArray();

            GeneratorJson.AddNewDefaultValue(key, new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = values
            });

            string typeInfo = targetType != originalType 
                ? $" (convertido de {GetTypeName(originalType)} a {GetTypeName(targetType)})" 
                : "";
            ConsoleHelper.WriteSuccess($"Configurado: {key} rotará entre {values.Length} valores{typeInfo}");
        }
        else
        {
            ConsoleHelper.WriteWarning("No se ingresaron valores");
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
