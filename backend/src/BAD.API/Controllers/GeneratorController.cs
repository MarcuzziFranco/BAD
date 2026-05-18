using BAD.API.DTOs;
using BAD.API.Helpers;
using BAD.Core.Analysis;
using BAD.Core.Configurations;
using BAD.Core.Generators;
using BAD.Core.Presets;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GeneratorController : ControllerBase
{
    private readonly PresetManager _presetManager;
    private readonly BadDbContext _context;

    public GeneratorController(BadDbContext context)
    {
        _presetManager = new PresetManager();
        _context = context;
    }

    /// <summary>
    /// Expande un preset del sistema a lista de configuraciones por campo (para guardar como preset de datos).
    /// </summary>
    [HttpPost("expand-preset")]
    public ActionResult<List<FieldConfigDto>> ExpandPreset([FromBody] ExpandPresetRequestDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PresetName))
                return BadRequest(new { error = "PresetName es obligatorio" });

            var preset = _presetManager.GetPresetByName(request.PresetName);
            if (preset == null)
                return NotFound(new { error = "Preset no encontrado" });

            var jsonObject = JObject.Parse(request.JsonContent);
            var list = PresetFieldConfigFactory.Expand(preset, jsonObject);
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Genera JSONs basados en un template con configuraciones personalizadas
    /// </summary>
    [HttpPost("generate")]
    public ActionResult<GenerateResponseDto> Generate(GenerateRequestDto request)
    {
        try
        {
            var jsonObject = JObject.Parse(request.JsonContent);
            var generator = new GeneratorJson();
            string? presetApplied = null;

            // Aplicar preset si se especificó
            if (!string.IsNullOrEmpty(request.PresetName))
            {
                var preset = _presetManager.GetPresetByName(request.PresetName);
                if (preset != null)
                {
                    _presetManager.ApplyPreset(preset, jsonObject, generator);
                    presetApplied = preset.Name;
                }
            }

            // Aplicar configuraciones personalizadas por campo (sobrescriben el preset)
            if (request.FieldConfigs != null && request.FieldConfigs.Count > 0)
            {
                foreach (var fieldConfig in request.FieldConfigs)
                {
                    var config = ConvertToDefaultValueConfig(fieldConfig);
                    if (config != null)
                    {
                        generator.AddDefaultValue(fieldConfig.Key, config);
                    }
                }
            }

            // Generar JSONs
            var generatedJsons = generator.GenerateMultiple(request.JsonContent, request.Count);

            int? savedTemplateId = null;

            // Guardar en base de datos si se especificó
            if (request.OutputFormat == "Database" && generatedJsons.Count > 0)
            {
                var template = new JsonTemplate
                {
                    Name = $"Generated_{DateTime.Now:yyyyMMdd_HHmmss}",
                    Description = $"Generado automáticamente. Preset: {presetApplied ?? "ninguno"}. Cantidad: {generatedJsons.Count}",
                    Content = generatedJsons.Count == 1 
                        ? generatedJsons[0] 
                        : JsonConvert.SerializeObject(generatedJsons.Select(j => JObject.Parse(j)).ToArray(), Formatting.Indented),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.JsonTemplates.Add(template);
                _context.SaveChanges();
                savedTemplateId = template.Id;
            }

            return Ok(new GenerateResponseDto(generatedJsons, presetApplied, savedTemplateId));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Analiza la estructura de un JSON
    /// </summary>
    [HttpPost("analyze")]
    public ActionResult<AnalyzeResponseDto> Analyze(AnalyzeRequestDto request)
    {
        try
        {
            var jsonObject = JObject.Parse(request.JsonContent);
            var fields = JsonAnalyzer.GetAllKeysWithTypes(jsonObject);

            var fieldDtos = fields.Select(f => new JsonFieldDto(
                f.Key,
                f.Type.ToString(),
                GetValuePreview(f.Value)
            )).ToList();

            return Ok(new AnalyzeResponseDto(fieldDtos));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene las operaciones disponibles para cada tipo de campo
    /// </summary>
    [HttpGet("operations")]
    public ActionResult GetOperations()
    {
        return Ok(new
        {
            operations = new[]
            {
                new { id = "Random", name = "Aleatorio", description = "Genera un valor aleatorio según el tipo" },
                new { id = "Replace", name = "Valor fijo", description = "Usa un valor específico" },
                new { id = "ForceNull", name = "Forzar NULL", description = "Siempre será null" },
                new { id = "NotChange", name = "No cambiar", description = "Mantiene el valor original" },
                new { id = "RandomRange", name = "Rango aleatorio", description = "Genera un valor dentro de un rango" },
                new { id = "RotateList", name = "Lista rotativa", description = "Rota entre una lista de valores" }
            },
            typeOperations = new Dictionary<string, string[]>
            {
                ["String"] = new[] { "Random", "Replace", "ForceNull", "NotChange", "RotateList" },
                ["Integer"] = new[] { "Random", "Replace", "ForceNull", "NotChange", "RandomRange", "RotateList" },
                ["Float"] = new[] { "Random", "Replace", "ForceNull", "NotChange", "RandomRange", "RotateList" },
                ["Boolean"] = new[] { "Random", "Replace", "ForceNull", "NotChange", "RotateList" },
                ["Date"] = new[] { "Random", "Replace", "ForceNull", "NotChange", "RandomRange", "RotateList" },
                ["Guid"] = new[] { "Random", "Replace", "ForceNull", "NotChange", "RotateList" },
                ["Null"] = new[] { "ForceNull", "Replace" }
            }
        });
    }

    private static DefaultValueConfig? ConvertToDefaultValueConfig(FieldConfigDto dto)
    {
        var config = new DefaultValueConfig();

        switch (dto.Operation)
        {
            case "Random":
                return null; // Sin configuración = aleatorio

            case "Replace":
                config.Operation = EnumOperations.Replace;
                config.Value = dto.Value;
                break;

            case "ForceNull":
                config.Operation = EnumOperations.ForceNull;
                break;

            case "NotChange":
                config.Operation = EnumOperations.NotChange;
                break;

            case "RandomRange":
                config.Operation = EnumOperations.RandomRange;
                config.MinValue = dto.MinValue;
                config.MaxValue = dto.MaxValue;
                break;

            case "RotateList":
                config.Operation = EnumOperations.Replace;
                config.TypeDefault = JTokenType.Array;
                config.Value = dto.ListValues?.ToArray();
                break;

            default:
                return null;
        }

        return config;
    }

    private static object? GetValuePreview(JToken value)
    {
        if (value is JObject || value is JArray)
            return value.Type.ToString();
        
        return value.ToString();
    }
}
