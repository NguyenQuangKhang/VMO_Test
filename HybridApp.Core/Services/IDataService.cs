namespace HybridApp.Core.Services;

public interface IDataService
{
    byte[] GenerateFlatBuffer(int count);
    double[] GenerateData(int count);
}
