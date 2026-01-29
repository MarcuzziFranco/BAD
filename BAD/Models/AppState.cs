using BAD.Generator;

namespace BAD.Models;

/// <summary>
/// Estado de la aplicación durante la sesión
/// </summary>
public class AppState
{
    /// <summary>
    /// Ruta del archivo JSON base seleccionado
    /// </summary>
    public string? SelectedJsonPath { get; set; }

    /// <summary>
    /// Contenido del JSON base cargado
    /// </summary>
    public string? JsonContent { get; set; }

    /// <summary>
    /// Nombre del archivo seleccionado (sin ruta)
    /// </summary>
    public string? FileName => Path.GetFileName(SelectedJsonPath);

    /// <summary>
    /// Cantidad de JSONs a generar
    /// </summary>
    public int GenerateCount { get; set; } = 5;

    /// <summary>
    /// Formato de salida seleccionado
    /// </summary>
    public OutputFormat OutputFormat { get; set; } = OutputFormat.Console;

    /// <summary>
    /// Lista de JSONs generados en la última ejecución
    /// </summary>
    public List<string> GeneratedJsons { get; set; } = new();

    /// <summary>
    /// URL del endpoint para testing
    /// </summary>
    public string? EndpointUrl { get; set; }

    /// <summary>
    /// Método HTTP a usar
    /// </summary>
    public HttpMethodType HttpMethod { get; set; } = HttpMethodType.POST;

    /// <summary>
    /// Configuración del generador
    /// </summary>
    public GeneratorConfig GeneratorConfig => GeneratorJson.Config;

    /// <summary>
    /// Indica si hay un JSON base cargado
    /// </summary>
    public bool HasJsonLoaded => !string.IsNullOrEmpty(JsonContent);

    /// <summary>
    /// Indica si hay JSONs generados
    /// </summary>
    public bool HasGeneratedJsons => GeneratedJsons.Count > 0;

    /// <summary>
    /// Limpia los JSONs generados
    /// </summary>
    public void ClearGeneratedJsons()
    {
        GeneratedJsons.Clear();
    }

    /// <summary>
    /// Obtiene un resumen del estado actual
    /// </summary>
    public string GetStatusSummary()
    {
        var status = new List<string>();

        if (HasJsonLoaded)
        {
            status.Add($"Archivo: {FileName}");
            status.Add($"Cantidad a generar: {GenerateCount}");
            status.Add($"Formato: {OutputFormat}");
        }
        else
        {
            status.Add("Sin archivo JSON seleccionado");
        }

        if (HasGeneratedJsons)
        {
            status.Add($"JSONs generados: {GeneratedJsons.Count}");
        }

        return string.Join(" | ", status);
    }
}

/// <summary>
/// Formatos de salida disponibles
/// </summary>
public enum OutputFormat
{
    /// <summary>
    /// Solo mostrar en consola
    /// </summary>
    Console,

    /// <summary>
    /// Un archivo por cada JSON generado
    /// </summary>
    MultipleFiles,

    /// <summary>
    /// Todos los JSONs en un solo archivo
    /// </summary>
    SingleFile
}

/// <summary>
/// Métodos HTTP soportados
/// </summary>
public enum HttpMethodType
{
    GET,
    POST,
    PUT,
    DELETE,
    PATCH
}
