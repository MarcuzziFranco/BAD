using BAD.Storage.Entities;
using Microsoft.EntityFrameworkCore;

namespace BAD.Storage.Context;

public class BadDbContext : DbContext
{
    public BadDbContext(DbContextOptions<BadDbContext> options) : base(options)
    {
    }

    public DbSet<JsonTemplate> JsonTemplates => Set<JsonTemplate>();
    public DbSet<RequestConfig> RequestConfigs => Set<RequestConfig>();
    public DbSet<TestExecution> TestExecutions => Set<TestExecution>();
    public DbSet<TestResult> TestResults => Set<TestResult>();
    public DbSet<GeneratorSetting> GeneratorSettings => Set<GeneratorSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // JsonTemplate
        modelBuilder.Entity<JsonTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Content).IsRequired();
            entity.HasIndex(e => e.Name);
        });

        // RequestConfig
        modelBuilder.Entity<RequestConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Method).IsRequired().HasMaxLength(10);
            entity.Property(e => e.AuthType).HasMaxLength(20);

            entity.HasOne(e => e.JsonTemplate)
                .WithMany(t => t.RequestConfigs)
                .HasForeignKey(e => e.JsonTemplateId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // TestExecution
        modelBuilder.Entity<TestExecution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PresetUsed).HasMaxLength(100);
            entity.HasIndex(e => e.ExecutedAt);

            entity.HasOne(e => e.RequestConfig)
                .WithMany(c => c.TestExecutions)
                .HasForeignKey(e => e.RequestConfigId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TestResult
        modelBuilder.Entity<TestResult>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.TestExecution)
                .WithMany(x => x.Results)
                .HasForeignKey(e => e.TestExecutionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // GeneratorSetting
        modelBuilder.Entity<GeneratorSetting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);

            entity.HasOne(e => e.JsonTemplate)
                .WithMany(t => t.GeneratorSettings)
                .HasForeignKey(e => e.JsonTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
