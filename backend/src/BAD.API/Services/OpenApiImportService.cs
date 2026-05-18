using BAD.Core.OpenApi;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using ResourceGroups = BAD.Storage.Entities.ResourceGroups;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace BAD.API.Services;

public class OpenApiImportService
{
    private static readonly JsonSerializerSettings OperationsJsonSettings = new()
    {
        ContractResolver = new CamelCasePropertyNamesContractResolver(),
        NullValueHandling = NullValueHandling.Ignore
    };

    private readonly BadDbContext _db;

    public OpenApiImportService(BadDbContext db)
    {
        _db = db;
    }

    public static List<OpenApiOperationPreview> DeserializeOperations(string operationsJson) =>
        JsonConvert.DeserializeObject<List<OpenApiOperationPreview>>(operationsJson, OperationsJsonSettings) ?? new();

    public static string SerializeOperations(IEnumerable<OpenApiOperationPreview> operations) =>
        JsonConvert.SerializeObject(operations, OperationsJsonSettings);

    public OpenApiAnalyzeResult AnalyzeSpec(string specJson, string? baseUrl = null) =>
        OpenApiImportAnalyzer.Analyze(specJson, baseUrl);

    public async Task<ApiCatalog> CreateCatalogAsync(
        string specJson,
        string baseUrl,
        string? name,
        CancellationToken ct = default)
    {
        var analyzed = AnalyzeSpec(specJson, baseUrl);
        var catalog = new ApiCatalog
        {
            Name = string.IsNullOrWhiteSpace(name) ? analyzed.InfoTitle : name.Trim(),
            BaseUrl = NormalizeBaseUrl(baseUrl),
            SpecJson = specJson,
            OpenApiVersion = analyzed.OpenApiVersion,
            InfoTitle = analyzed.InfoTitle,
            InfoVersion = analyzed.InfoVersion,
            OperationsJson = SerializeOperations(analyzed.Operations),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ApiCatalogs.Add(catalog);
        await _db.SaveChangesAsync(ct);
        await EnrichOperationsFromDbAsync(catalog, ct);
        return catalog;
    }

    public async Task<OpenApiReanalyzeResult> ReanalyzeCatalogAsync(
        int catalogId,
        string? specJson,
        string? baseUrl,
        CancellationToken ct = default)
    {
        var catalog = await _db.ApiCatalogs.FindAsync([catalogId], ct)
            ?? throw new KeyNotFoundException($"Catalog {catalogId} not found.");

        if (!string.IsNullOrWhiteSpace(specJson))
            catalog.SpecJson = specJson;
        if (!string.IsNullOrWhiteSpace(baseUrl))
            catalog.BaseUrl = NormalizeBaseUrl(baseUrl);

        var analyzed = AnalyzeSpec(catalog.SpecJson, catalog.BaseUrl);
        var previous = DeserializeOperations(catalog.OperationsJson)
            .ToDictionary(o => o.OperationKey, StringComparer.OrdinalIgnoreCase);

        var merged = new List<OpenApiOperationPreview>();
        var newKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var op in analyzed.Operations)
        {
            newKeys.Add(op.OperationKey);
            if (previous.TryGetValue(op.OperationKey, out var prev))
            {
                op.JsonTemplateId = prev.JsonTemplateId;
                op.RequestConfigId = prev.RequestConfigId;
                op.ImportStatus = prev.ImportStatus;
                op.ChangeKind = IsOperationModified(prev, op) ? "modified" : "unchanged";
            }
            else
            {
                op.ChangeKind = "new";
            }

            merged.Add(op);
        }

        foreach (var prev in previous.Values)
        {
            if (newKeys.Contains(prev.OperationKey))
                continue;
            prev.ChangeKind = "removed";
            merged.Add(prev);
        }

        catalog.OpenApiVersion = analyzed.OpenApiVersion;
        catalog.InfoTitle = analyzed.InfoTitle;
        catalog.InfoVersion = analyzed.InfoVersion;
        catalog.OperationsJson = SerializeOperations(merged);
        catalog.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await EnrichOperationsFromDbAsync(catalog, ct);

        var operations = DeserializeOperations(catalog.OperationsJson);
        return new OpenApiReanalyzeResult
        {
            Operations = operations,
            NewCount = operations.Count(o => o.ChangeKind == "new"),
            ModifiedCount = operations.Count(o => o.ChangeKind == "modified"),
            RemovedCount = operations.Count(o => o.ChangeKind == "removed")
        };
    }

    public async Task<OpenApiApplyResult> ApplyAsync(
        int catalogId,
        IReadOnlyList<string> operationKeys,
        bool updateExisting,
        bool createTemplates,
        bool createServices,
        CancellationToken ct = default)
    {
        var catalog = await _db.ApiCatalogs.FindAsync([catalogId], ct)
            ?? throw new KeyNotFoundException($"Catalog {catalogId} not found.");

        var operations = DeserializeOperations(catalog.OperationsJson);
        var keySet = new HashSet<string>(operationKeys, StringComparer.OrdinalIgnoreCase);
        var result = new OpenApiApplyResult();

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            foreach (var op in operations.Where(o => keySet.Contains(o.OperationKey)))
            {
                if (op.ChangeKind == "removed")
                {
                    result.Skipped++;
                    continue;
                }

                try
                {
                    EnsureSampleJson(op, catalog.SpecJson);

                    int? templateId = op.JsonTemplateId;
                    if (createTemplates && op.HasRequestBody)
                    {
                        var template = await FindOrCreateTemplateAsync(catalog, op, updateExisting, ct);
                        templateId = template.Id;
                        op.JsonTemplateId = templateId;
                        result.TemplatesCreated++;
                    }
                    else if (createTemplates && !op.HasRequestBody)
                    {
                        result.TemplatesSkippedNoBody++;
                    }

                    if (createServices)
                    {
                        var service = await FindOrCreateServiceAsync(catalog, op, templateId, updateExisting, ct);
                        op.RequestConfigId = service.Id;
                        result.ServicesCreated++;
                    }

                    op.ImportStatus = "linked";
                    op.Error = null;
                    result.Linked++;
                }
                catch (Exception ex)
                {
                    op.ImportStatus = "error";
                    op.Error = ex.Message;
                    result.Errors.Add(new OpenApiApplyError(op.OperationKey, ex.Message));
                }
            }

            catalog.OperationsJson = SerializeOperations(operations);
            catalog.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }

        result.Operations = operations;
        return result;
    }

    public async Task EnrichOperationsFromDbAsync(ApiCatalog catalog, CancellationToken ct = default)
    {
        var templates = await _db.JsonTemplates
            .Where(t => t.ApiCatalogId == catalog.Id && t.OpenApiOperationKey != null)
            .ToDictionaryAsync(t => t.OpenApiOperationKey!, t => t.Id, ct);

        var configs = await _db.RequestConfigs
            .Where(c => c.ApiCatalogId == catalog.Id && c.OpenApiOperationKey != null)
            .ToDictionaryAsync(c => c.OpenApiOperationKey!, c => c.Id, ct);

        var operations = DeserializeOperations(catalog.OperationsJson);
        var changed = false;
        foreach (var op in operations)
        {
            if (templates.TryGetValue(op.OperationKey, out var tid))
            {
                op.JsonTemplateId = tid;
                changed = true;
            }
            if (configs.TryGetValue(op.OperationKey, out var cid))
            {
                op.RequestConfigId = cid;
                op.ImportStatus = "linked";
                changed = true;
            }
        }

        if (changed)
        {
            catalog.OperationsJson = SerializeOperations(operations);
            await _db.SaveChangesAsync(ct);
        }
    }

    public static CatalogResourceCounts GetResourceCounts(IEnumerable<OpenApiOperationPreview> operations)
    {
        var list = operations.ToList();
        return new CatalogResourceCounts
        {
            OperationCount = list.Count(o => o.ChangeKind != "removed"),
            LinkedCount = list.Count(o => o.RequestConfigId != null || o.ImportStatus == "linked"),
            TemplateCount = list.Count(o => o.JsonTemplateId != null),
            ServiceCount = list.Count(o => o.RequestConfigId != null),
            PendingCount = list.Count(o =>
                o.ChangeKind != "removed" && o.RequestConfigId == null && o.ImportStatus != "linked")
        };
    }

    private void EnsureSampleJson(OpenApiOperationPreview op, string specJson)
    {
        if (!op.HasRequestBody)
            return;
        if (!string.IsNullOrWhiteSpace(op.SampleJson) && op.SampleJson.Trim() != "{}")
            return;

        try
        {
            var fresh = OpenApiImportAnalyzer.Analyze(specJson, null).Operations
                .FirstOrDefault(o => string.Equals(o.OperationKey, op.OperationKey, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(fresh?.SampleJson))
            {
                op.SampleJson = fresh.SampleJson;
                return;
            }
        }
        catch
        {
            /* fallback below */
        }

        op.SampleJson = "{}";
    }

    private static bool IsOperationModified(OpenApiOperationPreview prev, OpenApiOperationPreview next) =>
        prev.Path != next.Path ||
        prev.Method != next.Method ||
        prev.HasRequestBody != next.HasRequestBody ||
        (prev.SampleJson ?? "") != (next.SampleJson ?? "");

    private async Task<JsonTemplate> FindOrCreateTemplateAsync(
        ApiCatalog catalog,
        OpenApiOperationPreview op,
        bool updateExisting,
        CancellationToken ct)
    {
        var content = string.IsNullOrWhiteSpace(op.SampleJson) ? "{}" : op.SampleJson;

        var existing = await _db.JsonTemplates
            .FirstOrDefaultAsync(t => t.ApiCatalogId == catalog.Id && t.OpenApiOperationKey == op.OperationKey, ct);

        if (existing != null)
        {
            if (!updateExisting)
                return existing;

            existing.Content = content;
            existing.Name = op.SuggestedTemplateName;
            existing.Description = BuildDescription(catalog, op);
            existing.SourceGroup = catalog.Name;
            existing.UpdatedAt = DateTime.UtcNow;
            return existing;
        }

        var template = new JsonTemplate
        {
            Name = op.SuggestedTemplateName,
            Description = BuildDescription(catalog, op),
            Content = content,
            ApiCatalogId = catalog.Id,
            OpenApiOperationKey = op.OperationKey,
            SourceGroup = catalog.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.JsonTemplates.Add(template);
        await _db.SaveChangesAsync(ct);
        return template;
    }

    private async Task<RequestConfig> FindOrCreateServiceAsync(
        ApiCatalog catalog,
        OpenApiOperationPreview op,
        int? templateId,
        bool updateExisting,
        CancellationToken ct)
    {
        var existing = await _db.RequestConfigs
            .FirstOrDefaultAsync(c => c.ApiCatalogId == catalog.Id && c.OpenApiOperationKey == op.OperationKey, ct);

        var url = BuildServiceUrl(catalog.BaseUrl, op.Path);

        if (existing != null)
        {
            if (updateExisting)
            {
                existing.Url = url;
                existing.Method = op.Method;
                existing.Name = op.SuggestedServiceName;
            }

            if (templateId.HasValue && (updateExisting || existing.JsonTemplateId == null))
                existing.JsonTemplateId = templateId;

            if (updateExisting)
            {
                existing.SourceGroup = catalog.Name;
            }

            return existing;
        }

        var config = new RequestConfig
        {
            Name = op.SuggestedServiceName,
            Url = url,
            Method = op.Method,
            JsonTemplateId = templateId,
            ApiCatalogId = catalog.Id,
            OpenApiOperationKey = op.OperationKey,
            SourceGroup = catalog.Name,
            CreatedAt = DateTime.UtcNow
        };
        _db.RequestConfigs.Add(config);
        await _db.SaveChangesAsync(ct);
        return config;
    }

    private static string BuildDescription(ApiCatalog catalog, OpenApiOperationPreview op) =>
        $"OpenAPI [{catalog.Name}] {op.Tag}: {op.OperationKey}";

    public static string BuildServiceUrl(string baseUrl, string path)
    {
        var baseNorm = NormalizeBaseUrl(baseUrl);
        var pathNorm = path.StartsWith('/') ? path : "/" + path;
        return baseNorm.TrimEnd('/') + pathNorm;
    }

    public static string NormalizeBaseUrl(string baseUrl) =>
        string.IsNullOrWhiteSpace(baseUrl) ? "http://localhost" : baseUrl.Trim();

    public async Task SyncSourceGroupForCatalogAsync(int catalogId, string groupName, CancellationToken ct = default)
    {
        var templates = await _db.JsonTemplates
            .Where(t => t.ApiCatalogId == catalogId)
            .ToListAsync(ct);
        foreach (var t in templates)
            t.SourceGroup = groupName;

        var configs = await _db.RequestConfigs
            .Where(c => c.ApiCatalogId == catalogId)
            .ToListAsync(ct);
        foreach (var c in configs)
            c.SourceGroup = groupName;

        if (templates.Count > 0 || configs.Count > 0)
            await _db.SaveChangesAsync(ct);
    }
}

public class OpenApiApplyResult
{
    public int Linked { get; set; }
    public int TemplatesCreated { get; set; }
    public int ServicesCreated { get; set; }
    public int TemplatesSkippedNoBody { get; set; }
    public int Skipped { get; set; }
    public List<OpenApiApplyError> Errors { get; set; } = new();
    public List<OpenApiOperationPreview> Operations { get; set; } = new();
}

public class OpenApiReanalyzeResult
{
    public List<OpenApiOperationPreview> Operations { get; set; } = new();
    public int NewCount { get; set; }
    public int ModifiedCount { get; set; }
    public int RemovedCount { get; set; }
}

public class CatalogResourceCounts
{
    public int OperationCount { get; set; }
    public int LinkedCount { get; set; }
    public int TemplateCount { get; set; }
    public int ServiceCount { get; set; }
    public int PendingCount { get; set; }
}

public record OpenApiApplyError(string OperationKey, string Message);
