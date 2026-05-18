using BAD.Core.OpenApi;

namespace BAD.API.DTOs;

public record CreateOpenApiCatalogDto(
    string SpecJson,
    string BaseUrl,
    string? Name
);

public record UpdateOpenApiCatalogDto(
    string? Name,
    string? BaseUrl,
    string? SpecJson
);

public record OpenApiCatalogListItemDto(
    int Id,
    string Name,
    string BaseUrl,
    string? InfoTitle,
    string? InfoVersion,
    int OperationCount,
    int LinkedCount,
    int TemplateCount,
    int ServiceCount,
    int PendingCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record OpenApiCatalogDetailDto(
    int Id,
    string Name,
    string BaseUrl,
    string OpenApiVersion,
    string? InfoTitle,
    string? InfoVersion,
    List<OpenApiOperationPreview> Operations,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ApplyOpenApiCatalogDto(
    IReadOnlyList<string> OperationKeys,
    bool UpdateExisting = true,
    bool CreateTemplates = true,
    bool CreateServices = true
);

public record OpenApiApplyResponseDto(
    int Linked,
    int TemplatesCreated,
    int ServicesCreated,
    int TemplatesSkippedNoBody,
    int Skipped,
    IReadOnlyList<OpenApiApplyErrorDto> Errors,
    List<OpenApiOperationPreview> Operations
);

public record OpenApiAnalyzeResponseDto(
    OpenApiCatalogDetailDto Catalog,
    int NewCount,
    int ModifiedCount,
    int RemovedCount
);

public record OpenApiApplyErrorDto(string OperationKey, string Message);
