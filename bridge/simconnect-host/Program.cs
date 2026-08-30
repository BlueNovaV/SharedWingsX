using System;

namespace TwinSeat.SimConnectHost;

/// <summary>
/// Native Windows host against the official SimConnect SDK.
/// Compile with the MSFS SimConnect NuGet/SDK once installed.
/// The TypeScript bridge remains the session/authority engine; this process
/// only maps pack variable names to SimConnect requests.
/// </summary>
public static class Program
{
    public static int Main(string[] args)
    {
        Console.WriteLine("TwinSeat SimConnect host stub");
        Console.WriteLine("Map ATC / ATC_MENU_1-9 / COM swaps with TransmitClientEvent so both seats share clearance.");
        Console.WriteLine("Args: " + string.Join(' ', args));
        return 0;
    }
}
