using System;
using Google.FlatBuffers;
using HybridApp.FlatBuffers;

namespace HybridApp.Core.Services;

/// <summary>
/// CORE LAYER: Handles high-performance data generation and binary packing.
/// </summary>
public class DataService : IDataService
{
    public byte[] GenerateFlatBuffer(int count)
    {
        // 1. Generate data efficiently
        double[] data = new double[count];
        Span<double> dataSpan = data.AsSpan();
        Random rand = new Random();
        double current = 50.0;

        for (int i = 0; i < dataSpan.Length; i++)
        {
            current += (rand.NextDouble() - 0.5) * 2.0;
            dataSpan[i] = current;
        }

        // 2. Pack into binary format using FlatBuffers
        var builder = new FlatBufferBuilder(count * 8 + 1024);
        var dataOffset = DataPacket.CreateDataVectorBlock(builder, data);
        var titleOffset = builder.CreateString("Live Bitcoin Data");
        
        DataPacket.StartDataPacket(builder);
        DataPacket.AddData(builder, dataOffset);
        DataPacket.AddTitle(builder, titleOffset);
        var root = DataPacket.EndDataPacket(builder);
        
        builder.Finish(root.Value);
        return builder.SizedByteArray();
    }

    public double[] GenerateData(int count) => throw new NotImplementedException("Use GenerateFlatBuffer for hybrid performance.");
}
