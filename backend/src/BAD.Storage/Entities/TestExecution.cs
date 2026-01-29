namespace BAD.Storage.Entities;

/// <summary>
/// Registro de ejecución de tests
/// </summary>
public class TestExecution
{
    public int Id { get; set; }
    
    /// <summary>
    /// ID de la configuración de request usada
    /// </summary>
    public int RequestConfigId { get; set; }
    
    /// <summary>
    /// Nombre del preset usado (si aplica)
    /// </summary>
    public string? PresetUsed { get; set; }
    
    /// <summary>
    /// Total de requests ejecutadas
    /// </summary>
    public int TotalRequests { get; set; }
    
    /// <summary>
    /// Número de requests exitosas
    /// </summary>
    public int SuccessCount { get; set; }
    
    /// <summary>
    /// Número de requests fallidas
    /// </summary>
    public int FailureCount { get; set; }
    
    /// <summary>
    /// Tiempo promedio de respuesta en milisegundos
    /// </summary>
    public double AvgResponseTimeMs { get; set; }
    
    /// <summary>
    /// Tiempo mínimo de respuesta en milisegundos
    /// </summary>
    public double MinResponseTimeMs { get; set; }
    
    /// <summary>
    /// Tiempo máximo de respuesta en milisegundos
    /// </summary>
    public double MaxResponseTimeMs { get; set; }
    
    /// <summary>
    /// Fecha y hora de ejecución
    /// </summary>
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public RequestConfig RequestConfig { get; set; } = null!;
    public ICollection<TestResult> Results { get; set; } = new List<TestResult>();
}
