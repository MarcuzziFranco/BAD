using System.Net;

namespace BAD.Models;

/// <summary>
/// Resultado de una petición HTTP individual
/// </summary>
public class RequestResult
{
    /// <summary>
    /// Índice de la petición en el batch
    /// </summary>
    public int Index { get; set; }

    /// <summary>
    /// Payload JSON enviado en la petición
    /// </summary>
    public string RequestPayload { get; set; } = string.Empty;

    /// <summary>
    /// Cuerpo de la respuesta recibida
    /// </summary>
    public string ResponseBody { get; set; } = string.Empty;

    /// <summary>
    /// Código de estado HTTP de la respuesta
    /// </summary>
    public HttpStatusCode StatusCode { get; set; }

    /// <summary>
    /// Duración de la petición
    /// </summary>
    public TimeSpan Duration { get; set; }

    /// <summary>
    /// Mensaje de error si la petición falló
    /// </summary>
    public string? Error { get; set; }

    /// <summary>
    /// Indica si la petición fue exitosa
    /// </summary>
    public bool IsSuccess => string.IsNullOrEmpty(Error) && (int)StatusCode >= 200 && (int)StatusCode < 300;

    /// <summary>
    /// Timestamp de cuando se ejecutó la petición
    /// </summary>
    public DateTime ExecutedAt { get; set; } = DateTime.Now;
}
