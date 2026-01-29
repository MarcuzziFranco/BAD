using BAD.API.DTOs;
using BAD.Core.Presets;
using Microsoft.AspNetCore.Mvc;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PresetsController : ControllerBase
{
    private readonly PresetManager _presetManager;

    public PresetsController()
    {
        _presetManager = new PresetManager();
    }

    /// <summary>
    /// Obtiene todos los presets disponibles
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<PresetDto>> GetAll()
    {
        var presets = _presetManager.GetAllPresets()
            .Select(p => new PresetDto(
                p.Name,
                p.Description,
                p.Category.ToString()
            ))
            .ToList();

        return Ok(presets);
    }

    /// <summary>
    /// Obtiene presets agrupados por categoría
    /// </summary>
    [HttpGet("grouped")]
    public ActionResult<IEnumerable<PresetCategoryDto>> GetGrouped()
    {
        var grouped = _presetManager.GetPresetsGroupedByCategory()
            .Select(g => new PresetCategoryDto(
                g.Category,
                g.Presets.Select(p => new PresetDto(
                    p.Name,
                    p.Description,
                    p.Category.ToString()
                )).ToList()
            ))
            .ToList();

        return Ok(grouped);
    }

    /// <summary>
    /// Obtiene un preset por nombre
    /// </summary>
    [HttpGet("{name}")]
    public ActionResult<PresetDto> GetByName(string name)
    {
        var preset = _presetManager.GetPresetByName(name);

        if (preset == null)
            return NotFound();

        return Ok(new PresetDto(
            preset.Name,
            preset.Description,
            preset.Category.ToString()
        ));
    }
}
