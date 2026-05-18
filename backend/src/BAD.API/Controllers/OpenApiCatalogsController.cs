using BAD.API.DTOs;
using BAD.API.Services;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/openapi-catalogs")]
public class OpenApiCatalogsController : ControllerBase
{
    private readonly BadDbContext _db;
    private readonly OpenApiImportService _import;

    public OpenApiCatalogsController(BadDbContext db, OpenApiImportService import)
    {
        _db = db;
        _import = import;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OpenApiCatalogListItemDto>>> GetAll()
    {
        var items = await _db.ApiCatalogs
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var dtos = items.Select(c =>
        {
            var ops = OpenApiImportService.DeserializeOperations(c.OperationsJson);
            var counts = OpenApiImportService.GetResourceCounts(ops);
            return new OpenApiCatalogListItemDto(
                c.Id,
                c.Name,
                c.BaseUrl,
                c.InfoTitle,
                c.InfoVersion,
                counts.OperationCount,
                counts.LinkedCount,
                counts.TemplateCount,
                counts.ServiceCount,
                counts.PendingCount,
                c.CreatedAt,
                c.UpdatedAt);
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OpenApiCatalogDetailDto>> GetById(int id)
    {
        var catalog = await _db.ApiCatalogs.FindAsync(id);
        if (catalog == null)
            return NotFound();

        await _import.EnrichOperationsFromDbAsync(catalog);
        return Ok(ToDetailDto(catalog));
    }

    [HttpPost]
    public async Task<ActionResult<OpenApiCatalogDetailDto>> Create([FromBody] CreateOpenApiCatalogDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SpecJson))
            return BadRequest(new { error = "specJson is required." });
        if (string.IsNullOrWhiteSpace(dto.BaseUrl))
            return BadRequest(new { error = "baseUrl is required." });

        try
        {
            var catalog = await _import.CreateCatalogAsync(dto.SpecJson, dto.BaseUrl, dto.Name);
            return CreatedAtAction(nameof(GetById), new { id = catalog.Id }, ToDetailDto(catalog));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<OpenApiAnalyzeResponseDto>> Update(int id, [FromBody] UpdateOpenApiCatalogDto dto)
    {
        var catalog = await _db.ApiCatalogs.FindAsync(id);
        if (catalog == null)
            return NotFound();

        var previousName = catalog.Name;
        if (!string.IsNullOrWhiteSpace(dto.Name))
            catalog.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.BaseUrl))
            catalog.BaseUrl = OpenApiImportService.NormalizeBaseUrl(dto.BaseUrl);
        if (!string.IsNullOrWhiteSpace(dto.SpecJson))
            catalog.SpecJson = dto.SpecJson;

        catalog.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        OpenApiReanalyzeResult? diff = null;
        if (!string.IsNullOrWhiteSpace(dto.SpecJson))
            diff = await _import.ReanalyzeCatalogAsync(id, dto.SpecJson, dto.BaseUrl);
        else
            await _import.EnrichOperationsFromDbAsync(catalog);

        if (!string.IsNullOrWhiteSpace(dto.Name) && !string.Equals(previousName, catalog.Name, StringComparison.Ordinal))
            await _import.SyncSourceGroupForCatalogAsync(id, catalog.Name);

        await _db.Entry(catalog).ReloadAsync();
        return Ok(ToAnalyzeResponse(catalog, diff));
    }

    [HttpPost("{id:int}/analyze")]
    public async Task<ActionResult<OpenApiAnalyzeResponseDto>> Analyze(int id, [FromBody] UpdateOpenApiCatalogDto? dto)
    {
        var catalog = await _db.ApiCatalogs.FindAsync(id);
        if (catalog == null)
            return NotFound();

        try
        {
            var diff = await _import.ReanalyzeCatalogAsync(id, dto?.SpecJson, dto?.BaseUrl);
            await _db.Entry(catalog).ReloadAsync();
            return Ok(ToAnalyzeResponse(catalog, diff));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/apply")]
    public async Task<ActionResult<OpenApiApplyResponseDto>> Apply(int id, [FromBody] ApplyOpenApiCatalogDto dto)
    {
        if (dto.OperationKeys == null || dto.OperationKeys.Count == 0)
            return BadRequest(new { error = "operationKeys is required." });

        try
        {
            var result = await _import.ApplyAsync(
                id,
                dto.OperationKeys,
                dto.UpdateExisting,
                dto.CreateTemplates,
                dto.CreateServices);

            return Ok(new OpenApiApplyResponseDto(
                result.Linked,
                result.TemplatesCreated,
                result.ServicesCreated,
                result.TemplatesSkippedNoBody,
                result.Skipped,
                result.Errors.Select(e => new OpenApiApplyErrorDto(e.OperationKey, e.Message)).ToList(),
                result.Operations));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var catalog = await _db.ApiCatalogs.FindAsync(id);
        if (catalog == null)
            return NotFound();

        _db.ApiCatalogs.Remove(catalog);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static OpenApiCatalogDetailDto ToDetailDto(ApiCatalog catalog) =>
        new(
            catalog.Id,
            catalog.Name,
            catalog.BaseUrl,
            catalog.OpenApiVersion,
            catalog.InfoTitle,
            catalog.InfoVersion,
            OpenApiImportService.DeserializeOperations(catalog.OperationsJson),
            catalog.CreatedAt,
            catalog.UpdatedAt);

    private static OpenApiAnalyzeResponseDto ToAnalyzeResponse(ApiCatalog catalog, OpenApiReanalyzeResult? diff) =>
        new(
            ToDetailDto(catalog),
            diff?.NewCount ?? 0,
            diff?.ModifiedCount ?? 0,
            diff?.RemovedCount ?? 0);
}
