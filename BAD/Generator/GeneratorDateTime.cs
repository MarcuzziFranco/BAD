using System;

namespace BAD.Generator;

public class GeneratorDateTime : IGenerator<DateTime>
{
    private static readonly Random _random = new();
    private string _format = "yyyy-MM-dd";

    public string Format
    {
        get => _format;
        set => _format = value ?? "yyyy-MM-dd";
    }

    public DateTime Generate()
    {
        // Por defecto genera una fecha entre hace 50 años y hoy
        var min = DateTime.Now.AddYears(-50);
        var max = DateTime.Now;
        return Generate(min, max);
    }

    public DateTime Generate(DateTime min, DateTime max)
    {
        if (min > max)
        {
            (min, max) = (max, min); // Swap si están invertidos
        }

        int rangeDays = (max - min).Days;
        int randomDays = _random.Next(rangeDays + 1);

        DateTime randomDate = min.AddDays(randomDays);
        string date = randomDate.ToString(_format);
        return Convert.ToDateTime(date);
    }

    // Métodos estáticos para compatibilidad con código existente
    public static DateTime RandomDatetime(DateTime min, DateTime max, string format)
    {
        var generator = new GeneratorDateTime { Format = format };
        return generator.Generate(min, max);
    }

    public static DateTime RandomDatetime(string dateMin, string dateMax, string format)
    {
        var min = Convert.ToDateTime(dateMin);
        var max = Convert.ToDateTime(dateMax);
        return RandomDatetime(min, max, format);
    }
}
