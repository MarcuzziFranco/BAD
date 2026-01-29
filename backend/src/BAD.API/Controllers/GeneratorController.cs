using BAD.API.DTOs;
using BAD.Core.Analysis;
using BAD.Core.Generators;
using BAD.Core.Presets;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GeneratorController : ControllerBase
{
    private readonly PresetManager _presetManager;

    public GeneratorController()
    {
        _presetManager = new PresetManager();
    }

    /// <summary>
    /// Genera JSONs basados en un template
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

            // Generar JSONs
            var generatedJsons = generator.GenerateMultiple(request.JsonContent, request.Count);

            return Ok(new GenerateResponseDto(generatedJsons, presetApplied));
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

    private static object? GetValuePreview(JToken value)
    {
        if (value is JObject || value is JArray)
            return value.Type.ToString();
        
        return value.ToString();
    }
}
