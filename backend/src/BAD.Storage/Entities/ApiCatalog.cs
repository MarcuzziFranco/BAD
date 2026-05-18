namespace BAD.Storage.Entities;

/// <summary>
/// Catálogo importado desde una especificación OpenAPI 3.x.
/// </summary>
public class ApiCatalog
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = string.Empty;

    public string SpecJson { get; set; } = string.Empty;

    public string OpenApiVersion { get; set; } = "3.0.0";

    public string? InfoTitle { get; set; }

    public string? InfoVersion { get; set; }

    /// <summary>Snapshot JSON de operaciones analizadas (<see cref="BAD.Core.OpenApi.OpenApiOperationPreview"/>).</summary>
    public string OperationsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
