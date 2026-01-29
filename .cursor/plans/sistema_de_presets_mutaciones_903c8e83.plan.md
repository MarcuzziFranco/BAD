---
name: Sistema de Presets Mutaciones
overview: Implementar un sistema de presets (configuraciones predeterminadas) que apliquen mutaciones masivas a todos los campos del JSON sin necesidad de configurar campo por campo.
todos:
  - id: create-ipreset
    content: Crear interface IPreset y clase PresetManager
    status: completed
  - id: preset-original
    content: Implementar OriginalPreset - mantener valores originales
    status: completed
  - id: preset-random
    content: Implementar RandomPreset - valores aleatorios (limpiar config)
    status: completed
  - id: preset-null
    content: Implementar AllNullPreset - todos los valores null
    status: completed
  - id: preset-boundary
    content: Implementar BoundaryPreset - valores limite
    status: completed
  - id: preset-empty
    content: Implementar EmptyPreset - valores vacios
    status: completed
  - id: preset-extreme
    content: Implementar ExtremePreset - valores extremos
    status: completed
  - id: preset-injection
    content: Implementar InjectionPreset - caracteres especiales/inyeccion
    status: completed
  - id: preset-invalid
    content: Implementar InvalidTypesPreset - tipos incorrectos
    status: completed
  - id: menu-presets
    content: Agregar opcion de presets en menu principal de Program.cs
    status: completed
isProject: false
---

# Sistema de Presets de Mutaciones

## Objetivo

Agregar una opcion en el menu principal para aplicar "presets" o configuraciones predeterminadas que muten todo el JSON de forma masiva, sin tener que ir campo por campo.

## Presets a Implementar

### 1. Presets Basicos

- **Original**: Mantener todos los valores originales del JSON
- **Aleatorio**: Generar valores aleatorios para todos los campos (comportamiento actual por defecto)
- **Todo NULL**: Forzar todos los valores a null

### 2. Presets de Testing/QA

- **Valores Limite (Boundary)**: Usar valores en los limites segun tipo
  - Integer: 0, -1, MAX_INT, MIN_INT
  - Float: 0.0, -0.0, float.MaxValue
  - String: "" (vacio), " " (espacio)
  - Boolean: alternar true/false
  - Date: DateTime.MinValue, DateTime.MaxValue
- **Valores Vacios (Empty)**: 
  - String: ""
  - Integer/Float: 0
  - Boolean: false
  - Arrays: []
- **Valores Extremos (Extreme)**:
  - String: 1000+ caracteres
  - Integer: valores muy grandes/pequenos
  - Float: muchos decimales

### 3. Presets de Seguridad

- **Caracteres Especiales (Injection)**:
  - SQL Injection: `'; DROP TABLE users; --`
  - XSS: `<script>alert('xss')</script>`
  - Unicode: caracteres especiales, emojis
  - Path traversal: `../../../etc/passwd`
- **Tipos Invalidos (Invalid)**:
  - Donde va int, poner string
  - Donde va bool, poner numero
  - Donde va fecha, poner texto invalido

## Arquitectura

### Nuevos Archivos

```
BAD/
├── Presets/
│   ├── IPreset.cs              # Interface para presets
│   ├── PresetManager.cs        # Gestor de presets
│   └── Mutations/
│       ├── OriginalPreset.cs
│       ├── RandomPreset.cs
│       ├── AllNullPreset.cs
│       ├── BoundaryPreset.cs
│       ├── EmptyPreset.cs
│       ├── ExtremePreset.cs
│       ├── InjectionPreset.cs
│       └── InvalidTypesPreset.cs
```

### Interface IPreset

```csharp
public interface IPreset
{
    string Name { get; }
    string Description { get; }
    Dictionary<string, DefaultValueConfig> GenerateConfig(JObject jsonTemplate);
}
```

### Flujo de Uso

```mermaid
flowchart TD
    Menu[Menu Principal] --> Presets[8. Aplicar Preset]
    Presets --> SelectPreset[Seleccionar Preset]
    SelectPreset --> Original[Original]
    SelectPreset --> Random[Aleatorio]
    SelectPreset --> AllNull[Todo NULL]
    SelectPreset --> Boundary[Valores Limite]
    SelectPreset --> Empty[Valores Vacios]
    SelectPreset --> Extreme[Valores Extremos]
    SelectPreset --> Injection[Caracteres Especiales]
    SelectPreset --> Invalid[Tipos Invalidos]
    
    Original --> Apply[Aplicar a GeneratorJson.DefaultValuesOperations]
    Random --> Apply
    AllNull --> Apply
    Boundary --> Apply
    Empty --> Apply
    Extreme --> Apply
    Injection --> Apply
    Invalid --> Apply
    
    Apply --> Generate[Generar JSONs]
```



## Modificaciones en Program.cs

- Agregar nueva opcion "8. Aplicar preset de mutacion" en el menu principal
- Mostrar submenu con todos los presets disponibles
- Al seleccionar un preset, aplicar la configuracion masiva a `GeneratorJson.DefaultValuesOperations`

## Archivos a Modificar

- [BAD/Program.cs](BAD/Program.cs): Agregar opcion de menu y logica de seleccion de presets
- [BAD/Generator/GeneratorJson.cs](BAD/Generator/GeneratorJson.cs): Metodo para aplicar configuraciones masivas

