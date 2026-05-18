using BAD.Storage.Context;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
        options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "BAD API", Version = "v1" });
});

// Configure DbContext — anchor relative SQLite paths to content root (portable, stable path)
var sqliteConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=bad.db";
var csb = new SqliteConnectionStringBuilder(sqliteConn);
if (!Path.IsPathRooted(csb.DataSource))
    csb.DataSource = Path.Combine(builder.Environment.ContentRootPath, csb.DataSource);
builder.Services.AddDbContext<BadDbContext>(options =>
    options.UseSqlite(csb.ConnectionString));

// Configure CORS — localhost SPA (Vite :5012) o mismo host (:5013 con static embebido)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return true;
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                return string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
                    || uri.Host == "127.0.0.1";
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BadDbContext>();
    db.Database.Migrate();
}

var showSwagger = app.Environment.IsDevelopment()
    || app.Configuration.GetValue("Portable:ShowSwagger", false);
if (showSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BAD API v1");
    });
}

if (app.Configuration.GetValue("Portable:UseHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
