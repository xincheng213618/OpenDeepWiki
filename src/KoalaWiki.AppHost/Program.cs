var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.KoalaWiki>("koalawiki");

builder.Build().Run();
