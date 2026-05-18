using BAD.API.DTOs;
using BAD.Core.Flow;
using BAD.Core.Http;
using BAD.Core.Models;
using BAD.Core.Services;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace BAD.API.Services;

public static class FlowStepResolution
{
    public static async Task<FlowResolvedStep> ResolveAsync(BadDbContext context, FlowStepV1 step, CancellationToken ct = default)
    {
        JsonTemplate? template = null;
        var baseJson = step.BaseJson;

        if (step.TemplateId.HasValue)
        {
            template = await context.JsonTemplates.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == step.TemplateId.Value, ct);

            if (template != null && string.IsNullOrEmpty(baseJson))
                baseJson = template.Content;
        }

        string? presetUsedLabel = step.PresetName;
        List<FieldConfigDto>? effectiveMutations = step.Mutations?
            .Select(m => new FieldConfigDto
            {
                Key = m.Key,
                Operation = m.Operation,
                Value = m.Value,
                MinValue = m.MinValue,
                MaxValue = m.MaxValue,
                ListValues = m.ListValues
            }).ToList();
        var executionPresetName = step.PresetName;

        if (step.DataPresetId.HasValue)
        {
            var gs = await context.GeneratorSettings.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == step.DataPresetId.Value, ct);

            if (gs == null)
                throw new InvalidOperationException($"Preset de datos {step.DataPresetId} no encontrado.");

            if (!step.TemplateId.HasValue || gs.JsonTemplateId != step.TemplateId.Value)
                throw new InvalidOperationException("El preset de datos debe corresponder al template del paso.");

            try
            {
                effectiveMutations = JsonConvert.DeserializeObject<List<FieldConfigDto>>(gs.FieldConfigurations)
                    ?? new List<FieldConfigDto>();
            }
            catch
            {
                throw new InvalidOperationException("Preset de datos con configuración inválida.");
            }

            presetUsedLabel = $"data-preset:{gs.Name}";
            executionPresetName = null;
        }

        return new FlowResolvedStep(
            BaseJson: baseJson,
            TemplateId: step.TemplateId,
            BodyMode: step.BodyMode,
            EffectiveMutations: effectiveMutations,
            PresetUsedLabel: presetUsedLabel,
            ExecutionPresetName: executionPresetName,
            MutatePerIteration: step.MutatePerIteration);
    }

    public static ExecutionService.ExecutionConfig BuildExecutionConfig(
        FlowResolvedStep resolved,
        RequestConfig rc,
        int requestCount,
        string executionMode,
        int intervalMs,
        int executionId)
    {
        return new ExecutionService.ExecutionConfig
        {
            ExecutionId = executionId,
            Url = rc.Url,
            Method = Enum.Parse<HttpMethodType>(rc.Method, true),
            Headers = !string.IsNullOrEmpty(rc.Headers)
                ? JsonConvert.DeserializeObject<Dictionary<string, string>>(rc.Headers)
                : null,
            AuthType = rc.AuthType,
            AuthValue = rc.AuthValue,
            BodyMode = resolved.BodyMode,
            BaseJson = resolved.BaseJson,
            Mutations = resolved.EffectiveMutations?.Select(m => new ExecutionService.FieldMutationConfig
            {
                Key = m.Key,
                Operation = m.Operation,
                Value = m.Value,
                MinValue = m.MinValue,
                MaxValue = m.MaxValue,
                ListValues = m.ListValues
            }).ToList(),
            PresetName = resolved.ExecutionPresetName,
            RequestCount = requestCount,
            ExecutionMode = executionMode,
            IntervalMs = intervalMs,
            MutatePerIteration = resolved.MutatePerIteration
        };
    }
}

public record FlowResolvedStep(
    string? BaseJson,
    int? TemplateId,
    string BodyMode,
    List<FieldConfigDto>? EffectiveMutations,
    string? PresetUsedLabel,
    string? ExecutionPresetName,
    bool MutatePerIteration);
