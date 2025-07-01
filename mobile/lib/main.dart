import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'scanner_page.dart'; // Corrected to relative import
import 'package:workmanager/workmanager.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

const String backgroundSyncTask = 'vcBackgroundSync';

void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    if (task == backgroundSyncTask) {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final vcKeys = keys.where((k) => k.startsWith('vc_cache_'));
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity == ConnectivityResult.none) return true;
      for (final cacheKey in vcKeys) {
        final rawJwt = prefs.getString(cacheKey);
        if (rawJwt == null) continue;
        // Extract DID from JWT (assume it's in the payload)
        try {
          final parts = rawJwt.split('.');
          if (parts.length != 3) continue;
          final payload = json.decode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
          final did = payload['sub'] ?? payload['vc']?['credentialSubject']?['id'];
          if (did == null) continue;
          // Fetch revocation/eligibility status from backend
          final url = 'https://your-api-url/verify/$did'; // <-- Replace with your backend URL
          final resp = await http.get(Uri.parse(url));
          if (resp.statusCode == 200) {
            final data = json.decode(resp.body);
            final elig = data['eligibility'] ?? 'Unknown';
            final reason = data['revocationReason'] ?? '';
            final statusKey = 'vc_status_${rawJwt.hashCode}';
            final tsKey = 'vc_status_ts_${rawJwt.hashCode}';
            await prefs.setString(statusKey, elig);
            await prefs.setString('${statusKey}_reason', reason);
            await prefs.setString(tsKey, DateTime.now().toIso8601String());
          }
        } catch (_) {
          continue;
        }
      }
    }
    return true;
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: false,
  );
  await Workmanager().registerPeriodicTask(
    'vcBackgroundSyncTask',
    backgroundSyncTask,
    frequency: const Duration(hours: 6),
    initialDelay: const Duration(minutes: 5),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );
  runApp(const AgeVerificationApp());
}

class AgeVerificationApp extends StatelessWidget {
  const AgeVerificationApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgeTrust Verifier',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const VerificationHomePage(),
    );
  }
}

class VerificationHomePage extends StatefulWidget {
  const VerificationHomePage({super.key});

  @override
  State<VerificationHomePage> createState() => _VerificationHomePageState();
}

class _VerificationHomePageState extends State<VerificationHomePage> {
  Future<void> _scanAndVerify() async {
    // Navigate to the scanner and wait for a result.
    final did = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (context) => const ScannerPage()),
    );

    if (did == null || did.isEmpty) return;

    // Show a loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // IMPORTANT: Replace with your actual backend host. For Android emulator, use 10.0.2.2
      final url = Uri.parse('http://10.0.2.2:3001/api/verify/$did');
      final response = await http.get(url);

      // Dismiss the loading dialog
      Navigator.of(context, rootNavigator: true).pop();

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => VerificationResultPage(athleteData: data),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Verification Failed: ${json.decode(response.body)['message']}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Dismiss the loading dialog
      Navigator.of(context, rootNavigator: true).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('An error occurred: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AgeTrust Verifier'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Icon(Icons.qr_code_scanner, size: 100, color: Colors.blue),
            const SizedBox(height: 20),
            const Text(
              'Ready to Verify Athlete IDs',
              style: TextStyle(fontSize: 22),
            ),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: const Text('Scan QR Code'),
              onPressed: _scanAndVerify,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                textStyle: const TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// A new page to display the verification results
class VerificationResultPage extends StatelessWidget {
  final Map<String, dynamic> athleteData;

  const VerificationResultPage({super.key, required this.athleteData});
  
  @override
  Widget build(BuildContext context) {
    final age = athleteData['age'];
    final eligibility = athleteData['eligibility'] ?? 'Unknown';
    final status = athleteData['status'] ?? 'Unknown';
    final revocationReason = athleteData['revocationReason'];
    final did = athleteData['did'];
    Color badgeColor;
    IconData icon;
    if (eligibility == 'Eligible') {
      badgeColor = Colors.green;
      icon = Icons.check_circle;
    } else if (eligibility == 'Revoked') {
      badgeColor = Colors.red;
      icon = Icons.cancel;
    } else if (eligibility == 'Ineligible') {
      badgeColor = Colors.orange;
      icon = Icons.warning;
    } else {
      badgeColor = Colors.grey;
      icon = Icons.help_outline;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Verification Result')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Card(
          elevation: 4,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                      leading: Icon(icon, color: badgeColor, size: 40),
                  title: Row(
                    children: [
                          Text(
                            eligibility,
                            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: badgeColor),
                          ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: badgeColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                              status,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                Text('Name: ${athleteData['name']}', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                Text('Age: $age', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                Text('Date of Birth: ${athleteData['dob'].split('T')[0]}', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                Text('Sport: ${athleteData['sport']}', style: const TextStyle(fontSize: 18)),
                    const SizedBox(height: 8),
                    Text('DID:', style: const TextStyle(fontWeight: FontWeight.bold)),
                    SelectableText(athleteData['did'], style: const TextStyle(fontFamily: 'monospace')),
                const SizedBox(height: 16),
                    if (eligibility == 'Revoked' && revocationReason != null)
                      Container(
                        margin: const EdgeInsets.only(top: 8, bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error, color: Colors.red),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Revocation Reason: $revocationReason',
                                style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (eligibility == 'Ineligible')
                      Container(
                        margin: const EdgeInsets.only(top: 8, bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning, color: Colors.orange),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Text(
                                'Athlete is not age-eligible.',
                                style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
              ],
            ),
          ),
        ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.history),
              label: const Text('View Verification History'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                textStyle: const TextStyle(fontSize: 18),
              ),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => VerificationHistoryPage(did: did),
                  ),
                );
              },
            ),
            const Spacer(),
            Center(
              child: ElevatedButton.icon(
                icon: const Icon(Icons.home),
                label: const Text('Scan Another'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  textStyle: const TextStyle(fontSize: 18),
                ),
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VerificationHistoryPage extends StatefulWidget {
  final String did;
  const VerificationHistoryPage({super.key, required this.did});

  @override
  State<VerificationHistoryPage> createState() => _VerificationHistoryPageState();
}

class _VerificationHistoryPageState extends State<VerificationHistoryPage> {
  List<dynamic> logs = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    fetchLogs();
  }

  Future<void> fetchLogs() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      // IMPORTANT: Replace with your actual backend host. For Android emulator, use 10.0.2.2
      final url = Uri.parse('http://10.0.2.2:3001/api/logs/${widget.did}');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        setState(() {
          logs = json.decode(response.body);
          loading = false;
        });
      } else {
        setState(() {
          error = 'Failed to fetch logs.';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'An error occurred: $e';
        loading = false;
      });
    }
  }

  Color _getActionColor(String action) {
    if (action.startsWith('Revoked')) return Colors.red;
    if (action.startsWith('Verified')) return Colors.blue;
    if (action.startsWith('Registered')) return Colors.green;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verification History')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Center(child: Text(error!, style: const TextStyle(color: Colors.red)))
              : logs.isEmpty
                  ? const Center(child: Text('No history found for this athlete.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: logs.length,
                      separatorBuilder: (_, __) => const Divider(),
                      itemBuilder: (context, idx) {
                        final log = logs[idx];
                        final action = log['action'] ?? '';
                        final timestamp = log['timestamp'] ?? '';
                        final actor = log['actor_id'] ?? log['actor'] ?? 'N/A';
                        final reason = log['reason'] ?? '';
                        return ListTile(
                          leading: Icon(Icons.event_note, color: _getActionColor(action)),
                          title: Text(action, style: TextStyle(color: _getActionColor(action), fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Time: ${timestamp.toString().replaceFirst('T', ' ').split('.').first}'),
                              Text('Actor: $actor'),
                              if (reason.isNotEmpty) Text('Reason: $reason', style: const TextStyle(color: Colors.red)),
                            ],
                          ),
                        );
                      },
      ),
    );
  }
} 