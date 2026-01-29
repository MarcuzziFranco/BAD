namespace BAD.Core.Models;

/// <summary>
/// Resumen de ejecución de un batch de requests
/// </summary>
public class ExecutionSummary
{
    /// <summary>
    /// Nombre del archivo JSON base usado
    /// </summary>
    public string SourceFile { get; set; } = string.Empty;

    /// <summary>
    /// URL del endpoint testeado
    /// </summary>
    public string EndpointUrl { get; set; } = string.Empty;

    /// <summary>
    /// Método HTTP usado
    /// </summary>
    public string HttpMethod { get; set; } = string.Empty;

    /// <summary>
    /// Total de peticiones ejecutadas
    /// </summary>
    public int TotalRequests { get; set; }

    /// <summary>
    /// Número de peticiones exitosas
    /// </summary>
    public int Successful { get; set; }

    /// <summary>
    /// Número de peticiones fallidas
    /// </summary>
    public int Failed { get; set; }

    /// <summary>
    /// Tiempo promedio de respuesta
    /// </summary>
    public TimeSpan AverageResponseTime { get; set; }

    /// <summary>
    /// Tiempo mínimo de respuesta
    /// </summary>
    public TimeSpan MinResponseTime { get; set; }

    /// <summary>
    /// Tiempo máximo de respuesta
    /// </summary>
    public TimeSpan MaxResponseTime { get; set; }

    /// <summary>
    /// Duración total de la ejecución
    /// </summary>
    public TimeSpan TotalDuration { get; set; }

    /// <summary>
    /// Timestamp de inicio de la ejecución
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// Timestamp de fin de la ejecución
    /// </summary>
    public DateTime FinishedAt { get; set; }

    /// <summary>
    /// Lista de errores encontrados
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Porcentaje de éxito
    /// </summary>
    public double SuccessRate => TotalRequests > 0 ? (double)Successful / TotalRequests * 100 : 0;

    /// <summary>
    /// Genera el resumen desde una lista de resultados
    /// </summary>
    public static ExecutionSummary FromResults(List<RequestResult> results, string sourceFile, string url, string method)
    {
        var summary = new ExecutionSummary
        {
            SourceFile = sourceFile,
            EndpointUrl = url,
            HttpMethod = method,
            TotalRequests = results.Count,
            Successful = results.Count(r => r.IsSuccess),
            Failed = results.Count(r => !r.IsSuccess),
            StartedAt = results.Min(r => r.ExecutedAt),
            FinishedAt = results.Max(r => r.ExecutedAt)
        };

        if (results.Count > 0)
        {
            var durations = results.Select(r => r.Duration).ToList();
            summary.AverageResponseTime = TimeSpan.FromMilliseconds(durations.Average(d => d.TotalMilliseconds));
            summary.MinResponseTime = durations.Min();
            summary.MaxResponseTime = durations.Max();
            summary.TotalDuration = summary.FinishedAt - summary.StartedAt;
            summary.Errors = results
                .Where(r => !string.IsNullOrEmpty(r.Error))
                .Select(r => $"[{r.Index}] {r.Error}")
                .ToList();
        }

        return summary;
    }
}
