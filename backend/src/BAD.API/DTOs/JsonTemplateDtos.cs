namespace BAD.API.DTOs;

public record CreateJsonTemplateDto(string Name, string? Description, string Content);

public record UpdateJsonTemplateDto(string Name, string? Description, string Content);

public record JsonTemplateDto(
    int Id,
    string Name,
    string? Description,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
