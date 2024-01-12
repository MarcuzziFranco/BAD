using Newtonsoft.Json;
using System.Text;

namespace BAD.Services;

public class ExternalResources
{
    public static async Task<TResponse> GetAsync<TResponse>(string url)
    {
        return await GetAsync<TResponse, object?>(url, null);
    }

    public static async Task<TResponse> GetAsync<TResponse, TParams>(string url, TParams queryParams)
    {
        string completeUrl = url;
        if (queryParams is not null)
        {
            completeUrl += $"?{queryParams.ToQueryString()}";
        }
        using (var client = new HttpClient() { BaseAddress = new Uri(url) })
        {
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Connection.Clear();
            client.DefaultRequestHeaders.ConnectionClose = false;
            client.DefaultRequestHeaders.Connection.Add("Keep-Alive");
            client.Timeout = new TimeSpan(0, 1, 30);
            var response = await client.GetAsync(completeUrl);
            response.EnsureSuccessStatusCode();
            var stringResponse = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<TResponse>(stringResponse);
        }
    }

    public static async Task<TResponse> PostAsync<TResponse, TBody>(string url, TBody body)
    {
        using (var client = new HttpClient() { BaseAddress = new Uri(url) })
        {
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Connection.Clear();
            client.DefaultRequestHeaders.ConnectionClose = false;
            client.DefaultRequestHeaders.Connection.Add("Keep-Alive");
            client.Timeout = new TimeSpan(0, 1, 30);
            var myContent = JsonConvert.SerializeObject(body);
            var stringContent = new StringContent(myContent, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, stringContent);
            response.EnsureSuccessStatusCode();
            var stringResponse = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<TResponse>(stringResponse);
        }
    }
}
