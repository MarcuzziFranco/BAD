namespace BAD.Storage.Entities;

/// <summary>
/// Resultado individual de una request de test
/// </summary>
public class TestResult
{
    public int Id { get; set; }
    
    /// <summary>
    /// ID de la ejecución de test
    /// </summary>
    public int TestExecutionId { get; set; }
    
    /// <summary>
    /// Índice de la request en el batch
    /// </summary>
    public int Index { get; set; }
    
    /// <summary>
    /// Payload JSON enviado
    /// </summary>
    public string RequestPayload { get; set; } = string.Empty;
    
    /// <summary>
    /// Cuerpo de la respuesta recibida
    /// </summary>
    public string? ResponseBody { get; set; }
    
    /// <summary>
    /// Código de estado HTTP
    /// </summary>
    public int StatusCode { get; set; }
    
    /// <summary>
    /// Duración de la request en milisegundos
    /// </summary>
    public double DurationMs { get; set; }
    
    /// <summary>
    /// Mensaje de error si la request falló
    /// </summary>
    public string? Error { get; set; }
    
    /// <summary>
    /// Indica si la request fue exitosa
    /// </summary>
    public bool IsSuccess { get; set; }

    // Navegación
    public TestExecution TestExecution { get; set; } = null!;
}
