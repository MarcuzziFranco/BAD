namespace BAD.Core.OpenApi;

public class OpenApiOperationPreview
{
    public string OperationKey { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string? Tag { get; set; }
    public string? Summary { get; set; }
    public bool HasRequestBody { get; set; }
    public string? RequestSchemaRef { get; set; }
    public string? SampleJson { get; set; }
    public string SuggestedTemplateName { get; set; } = string.Empty;
    public string SuggestedServiceName { get; set; } = string.Empty;
    public int? JsonTemplateId { get; set; }
    public int? RequestConfigId { get; set; }
    public string ImportStatus { get; set; } = "pending";
    public string? Error { get; set; }
    /// <summary>Tras re-analizar: new, modified, removed, unchanged.</summary>
    public string? ChangeKind { get; set; }
}

public class OpenApiAnalyzeResult
{
    public string OpenApiVersion { get; set; } = string.Empty;
    public string InfoTitle { get; set; } = string.Empty;
    public string InfoVersion { get; set; } = string.Empty;
    public string? SuggestedBaseUrl { get; set; }
    public List<OpenApiOperationPreview> Operations { get; set; } = new();
}
