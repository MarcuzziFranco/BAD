namespace BAD.API.DTOs;

public record CreateJsonTemplateDto(
    string Name,
    string? Description,
    string Content,
    int? LinkRequestConfigId = null);

public record UpdateJsonTemplateDto(
    string Name,
    string? Description,
    string Content,
    int? LinkRequestConfigId = null);

public record LinkedRequestConfigSummary(int Id, string Name, string Method, string Url);

public record JsonTemplateDto(
    int Id,
    string Name,
    string? Description,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string SourceGroup,
    int? ApiCatalogId = null,
    string? OpenApiOperationKey = null,
    IReadOnlyList<LinkedRequestConfigSummary>? LinkedServices = null
);
