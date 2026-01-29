using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using BAD.Core.Models;

namespace BAD.Core.Http;

/// <summary>
/// Ejecutor de requests HTTP en batch
/// </summary>
public class RequestExecutor : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly TimeSpan _timeout;

    /// <summary>
    /// Evento que se dispara cuando se completa cada request
    /// </summary>
    public event Action<int, int, bool>? OnRequestCompleted;

    public RequestExecutor(TimeSpan? timeout = null)
    {
        _timeout = timeout ?? TimeSpan.FromSeconds(30);
        _httpClient = new HttpClient
        {
            Timeout = _timeout
        };
        _httpClient.DefaultRequestHeaders.Accept.Clear();
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    /// <summary>
    /// Configura headers adicionales para las requests
    /// </summary>
    public void SetHeaders(Dictionary<string, string> headers)
    {
        foreach (var header in headers)
        {
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation(header.Key, header.Value);
        }
    }

    /// <summary>
    /// Configura autenticación Bearer token
    /// </summary>
    public void SetBearerToken(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// Configura autenticación Basic
    /// </summary>
    public void SetBasicAuth(string username, string password)
    {
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Basic", credentials);
    }

    /// <summary>
    /// Ejecuta un batch de requests con los payloads proporcionados
    /// </summary>
    public async Task<List<RequestResult>> ExecuteBatchAsync(
        string url,
        HttpMethodType method,
        List<string> jsonPayloads,
        bool sequential = true)
    {
        var results = new List<RequestResult>();

        if (sequential)
        {
            for (int i = 0; i < jsonPayloads.Count; i++)
            {
                var result = await ExecuteSingleRequestAsync(url, method, jsonPayloads[i], i);
                results.Add(result);
                OnRequestCompleted?.Invoke(i + 1, jsonPayloads.Count, result.IsSuccess);
            }
        }
        else
        {
            var tasks = jsonPayloads.Select((payload, index) =>
                ExecuteSingleRequestAsync(url, method, payload, index)).ToList();

            var completedResults = await Task.WhenAll(tasks);
            results.AddRange(completedResults.OrderBy(r => r.Index));
        }

        return results;
    }

    /// <summary>
    /// Ejecuta una única request HTTP
    /// </summary>
    public async Task<RequestResult> ExecuteSingleRequestAsync(
        string url,
        HttpMethodType method,
        string jsonPayload,
        int index)
    {
        var result = new RequestResult
        {
            Index = index,
            RequestPayload = jsonPayload,
            ExecutedAt = DateTime.Now
        };

        var stopwatch = Stopwatch.StartNew();

        try
        {
            HttpResponseMessage response;
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            response = method switch
            {
                HttpMethodType.GET => await _httpClient.GetAsync(url),
                HttpMethodType.POST => await _httpClient.PostAsync(url, content),
                HttpMethodType.PUT => await _httpClient.PutAsync(url, content),
                HttpMethodType.DELETE => await _httpClient.DeleteAsync(url),
                HttpMethodType.PATCH => await _httpClient.SendAsync(
                    new HttpRequestMessage(HttpMethod.Patch, url) { Content = content }),
                _ => throw new ArgumentException($"Método HTTP no soportado: {method}")
            };

            stopwatch.Stop();

            result.StatusCode = response.StatusCode;
            result.ResponseBody = await response.Content.ReadAsStringAsync();
            result.Duration = stopwatch.Elapsed;

            if (!response.IsSuccessStatusCode)
            {
                result.Error = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}";
            }
        }
        catch (TaskCanceledException)
        {
            stopwatch.Stop();
            result.Duration = stopwatch.Elapsed;
            result.StatusCode = HttpStatusCode.RequestTimeout;
            result.Error = $"Timeout después de {_timeout.TotalSeconds}s";
        }
        catch (HttpRequestException ex)
        {
            stopwatch.Stop();
            result.Duration = stopwatch.Elapsed;
            result.StatusCode = HttpStatusCode.ServiceUnavailable;
            result.Error = $"Error de conexión: {ex.Message}";
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            result.Duration = stopwatch.Elapsed;
            result.StatusCode = HttpStatusCode.InternalServerError;
            result.Error = $"Error inesperado: {ex.Message}";
        }

        return result;
    }

    /// <summary>
    /// Valida que la URL sea accesible
    /// </summary>
    public async Task<(bool isValid, string message)> ValidateUrlAsync(string url)
    {
        try
        {
            var uri = new Uri(url);
            var response = await _httpClient.SendAsync(
                new HttpRequestMessage(HttpMethod.Head, uri));
            return (true, $"URL accesible (HTTP {(int)response.StatusCode})");
        }
        catch (UriFormatException)
        {
            return (false, "Formato de URL inválido");
        }
        catch (HttpRequestException ex)
        {
            return (false, $"No se puede conectar: {ex.Message}");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    public void Dispose()
    {
        _httpClient.Dispose();
    }
}
