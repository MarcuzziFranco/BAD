namespace BAD.Storage.Entities;



/// <summary>

/// Definición persistida de un DAG de ejecuciones (JSON versionado en DefinitionJson).

/// </summary>

public class ExecutionFlow

{

    public int Id { get; set; }



    public string Name { get; set; } = string.Empty;



    public string? Description { get; set; }



    /// <summary>Esquema de la definición (ej. 1).</summary>

    public int DefinitionVersion { get; set; } = 1;



    /// <summary>Documento canónico: nodos, aristas y configuración de pasos (FlowDefinition v1).</summary>

    public string DefinitionJson { get; set; } = "{}";



    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;



    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;



    public ICollection<FlowRun> FlowRuns { get; set; } = new List<FlowRun>();

}

