namespace BAD.ConsoleUI;

/// <summary>
/// Helper para operaciones de consola con colores y formato
/// </summary>
public static class ConsoleHelper
{
    public static void WriteSuccess(string message)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine(message);
        Console.ResetColor();
    }

    public static void WriteError(string message)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(message);
        Console.ResetColor();
    }

    public static void WriteWarning(string message)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine(message);
        Console.ResetColor();
    }

    public static void WriteInfo(string message)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(message);
        Console.ResetColor();
    }

    public static void WriteHeader(string title)
    {
        Console.ForegroundColor = ConsoleColor.Magenta;
        Console.WriteLine($"\n{'='.ToString().PadRight(50, '=')}");
        Console.WriteLine($"  {title}");
        Console.WriteLine($"{'='.ToString().PadRight(50, '=')}");
        Console.ResetColor();
    }

    public static void WriteSeparator()
    {
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine(new string('-', 50));
        Console.ResetColor();
    }

    /// <summary>
    /// Muestra un menú con selección por flechas
    /// </summary>
    public static int ShowMenu(string title, string[] options, int currentSelection = 0)
    {
        ConsoleKeyInfo key;
        int selected = currentSelection;

        do
        {
            Console.Clear();
            WriteHeader(title);
            Console.WriteLine();

            for (int i = 0; i < options.Length; i++)
            {
                if (i == selected)
                {
                    Console.BackgroundColor = ConsoleColor.DarkCyan;
                    Console.ForegroundColor = ConsoleColor.White;
                    Console.WriteLine($"  > {options[i]}");
                    Console.ResetColor();
                }
                else
                {
                    Console.WriteLine($"    {options[i]}");
                }
            }

            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine("Use flechas arriba/abajo para navegar, Enter para seleccionar");
            Console.ResetColor();

            key = Console.ReadKey(true);

            if (key.Key == ConsoleKey.UpArrow && selected > 0)
            {
                selected--;
            }
            else if (key.Key == ConsoleKey.DownArrow && selected < options.Length - 1)
            {
                selected++;
            }

        } while (key.Key != ConsoleKey.Enter);

        return selected;
    }

    /// <summary>
    /// Solicita un número entero al usuario
    /// </summary>
    public static int GetIntInput(string prompt, int min = 1, int max = int.MaxValue, int defaultValue = 1)
    {
        while (true)
        {
            Console.Write($"{prompt} [{defaultValue}]: ");
            string? input = Console.ReadLine();

            if (string.IsNullOrWhiteSpace(input))
            {
                return defaultValue;
            }

            if (int.TryParse(input, out int value) && value >= min && value <= max)
            {
                return value;
            }

            WriteError($"Por favor ingrese un número entre {min} y {max}");
        }
    }

    /// <summary>
    /// Solicita una cadena al usuario
    /// </summary>
    public static string GetStringInput(string prompt, string defaultValue = "")
    {
        Console.Write($"{prompt}");
        if (!string.IsNullOrEmpty(defaultValue))
        {
            Console.Write($" [{defaultValue}]");
        }
        Console.Write(": ");

        string? input = Console.ReadLine();
        return string.IsNullOrWhiteSpace(input) ? defaultValue : input;
    }

    /// <summary>
    /// Solicita confirmación al usuario
    /// </summary>
    public static bool Confirm(string message)
    {
        Console.Write($"{message} (s/n): ");
        var key = Console.ReadKey();
        Console.WriteLine();
        return key.KeyChar == 's' || key.KeyChar == 'S';
    }

    /// <summary>
    /// Muestra una barra de progreso
    /// </summary>
    public static void ShowProgress(int current, int total, string message = "")
    {
        int progressWidth = 40;
        double percentage = (double)current / total;
        int filled = (int)(progressWidth * percentage);

        Console.Write("\r");
        Console.Write($"[");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.Write(new string('#', filled));
        Console.ResetColor();
        Console.Write(new string('-', progressWidth - filled));
        Console.Write($"] {percentage:P0} ({current}/{total})");

        if (!string.IsNullOrEmpty(message))
        {
            Console.Write($" - {message}");
        }

        if (current == total)
        {
            Console.WriteLine();
        }
    }

    /// <summary>
    /// Espera que el usuario presione una tecla
    /// </summary>
    public static void WaitForKey(string message = "Presione cualquier tecla para continuar...")
    {
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine(message);
        Console.ResetColor();
        Console.ReadKey(true);
    }

    /// <summary>
    /// Muestra JSON formateado con colores
    /// </summary>
    public static void WriteJson(string json)
    {
        Console.ForegroundColor = ConsoleColor.Gray;
        Console.WriteLine(json);
        Console.ResetColor();
    }
}
