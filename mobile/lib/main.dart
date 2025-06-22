import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'scanner_page.dart'; // Corrected to relative import

void main() {
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
  
  int _calculateAge(String dob) {
    final birthDate = DateTime.parse(dob);
    final today = DateTime.now();
    int age = today.year - birthDate.year;
    if (today.month < birthDate.month || (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  @override
  Widget build(BuildContext context) {
    final age = _calculateAge(athleteData['dob']);

    return Scaffold(
      appBar: AppBar(title: const Text('Verification Result')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Card(
          elevation: 4,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const ListTile(
                  leading: Icon(Icons.verified_user, color: Colors.green, size: 40),
                  title: Text('Verified', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green)),
                ),
                const Divider(),
                Text('Name: ${athleteData['name']}', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                Text('Age: $age', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                Text('Date of Birth: ${athleteData['dob'].split('T')[0]}', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                Text('Sport: ${athleteData['sport']}', style: const TextStyle(fontSize: 18)),
                const SizedBox(height: 16),
                const Divider(),
                const Text('DID:', style: TextStyle(fontWeight: FontWeight.bold)),
                SelectableText(athleteData['did'], style: const TextStyle(fontFamily: 'monospace')),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 