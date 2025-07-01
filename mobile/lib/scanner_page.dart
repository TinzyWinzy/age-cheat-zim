import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';
import 'package:web3dart/crypto.dart';
import 'package:web3dart/web3dart.dart';
import 'package:convert/convert.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

// Replace with your actual issuer address (EIP-55 format)
const String issuerAddress = '0xYourIssuerAddressHere';

class ScannerPage extends StatelessWidget {
  const ScannerPage({super.key});

  void handleScannedJwt(BuildContext context, String jwt) {
    try {
      final jwtObj = JWT.decode(jwt); // No verification yet
      final payload = jwtObj.payload;
      final subject = payload['vc']?['credentialSubject'] ?? {};
      final name = subject['name'] ?? '';
      final dob = subject['dob'] ?? '';
      final sport = subject['sport'] ?? '';
      // Add more fields as needed
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => VCPreviewPage(
            name: name,
            dob: dob,
            sport: sport,
            rawJwt: jwt,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid credential QR code.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Athlete Credential QR')),
      body: MobileScanner(
        onDetect: (capture) {
          final List<Barcode> barcodes = capture.barcodes;
          if (barcodes.isNotEmpty) {
            final String? jwt = barcodes.first.rawValue;
            if (jwt != null && jwt.isNotEmpty) {
              handleScannedJwt(context, jwt);
            }
          }
        },
        errorBuilder: (context, error, child) {
          return Center(
            child: Text('An error occurred: $error'),
          );
        },
      ),
    );
  }
}

class VCPreviewPage extends StatefulWidget {
  final String name;
  final String dob;
  final String sport;
  final String rawJwt;

  const VCPreviewPage({super.key, required this.name, required this.dob, required this.sport, required this.rawJwt});

  @override
  State<VCPreviewPage> createState() => _VCPreviewPageState();
}

class _VCPreviewPageState extends State<VCPreviewPage> {
  bool? isSignatureValid;
  String? errorMsg;
  String eligibility = 'Unknown';
  String? revocationReason;
  int? age;
  bool isOnline = true;
  bool usedCache = false;
  bool cacheStale = false;
  DateTime? cacheTimestamp;

  static const cacheStaleThreshold = Duration(hours: 24);

  @override
  void initState() {
    super.initState();
    checkConnectivityAndLoad();
  }

  Future<void> checkConnectivityAndLoad() async {
    final connectivity = await Connectivity().checkConnectivity();
    setState(() {
      isOnline = connectivity != ConnectivityResult.none;
    });
    await verifySignatureAndEligibility();
  }

  Future<void> verifySignatureAndEligibility({bool forceRefresh = false}) async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = 'vc_cache_${widget.rawJwt.hashCode}';
    final statusKey = 'vc_status_${widget.rawJwt.hashCode}';
    final tsKey = 'vc_status_ts_${widget.rawJwt.hashCode}';
    bool cacheHit = false;
    bool stale = false;
    String? cachedStatus;
    String? cachedReason;
    DateTime? cachedTs;

    if (!isOnline || !forceRefresh) {
      // Try to load from cache
      cachedStatus = prefs.getString(statusKey);
      cachedReason = prefs.getString('${statusKey}_reason');
      final tsStr = prefs.getString(tsKey);
      if (cachedStatus != null && tsStr != null) {
        cachedTs = DateTime.tryParse(tsStr);
        if (cachedTs != null) {
          final now = DateTime.now();
          if (now.difference(cachedTs) > cacheStaleThreshold) {
            stale = true;
          }
        }
        cacheHit = true;
      }
    }

    try {
      final valid = await verifyJwtSignature(widget.rawJwt, issuerAddress);
      // Parse eligibility
      String elig = 'Unknown';
      String? reason;
      int? parsedAge;
      try {
        final jwtObj = JWT.decode(widget.rawJwt);
        final payload = jwtObj.payload;
        final subject = payload['vc']?['credentialSubject'] ?? {};
        final dobStr = subject['dob'] ?? '';
        if (dobStr.isNotEmpty) {
          final dob = DateTime.tryParse(dobStr);
          if (dob != null) {
            final now = DateTime.now();
            parsedAge = now.year - dob.year - ((now.month < dob.month || (now.month == dob.month && now.day < dob.day)) ? 1 : 0);
            if (parsedAge >= 10 && parsedAge <= 18) {
              elig = 'Eligible';
            } else {
              elig = 'Ineligible';
            }
          } else {
            elig = 'Unknown';
          }
        }
        // Check for revocation in payload (if present)
        if (payload['status'] == 'Revoked' || subject['status'] == 'Revoked') {
          elig = 'Revoked';
          reason = payload['revocationReason'] ?? subject['revocationReason'];
        }
      } catch (_) {
        elig = 'Unknown';
      }
      // If online and not using cache, fetch revocation status from backend (simulate)
      if (isOnline && !forceRefresh) {
        // Simulate API call: in real app, fetch /verify/:did or /logs/:did
        // For now, just use parsed values
        await prefs.setString(cacheKey, widget.rawJwt);
        await prefs.setString(statusKey, elig);
        await prefs.setString('${statusKey}_reason', reason ?? '');
        await prefs.setString(tsKey, DateTime.now().toIso8601String());
        cacheHit = false;
        stale = false;
      } else if (cacheHit) {
        elig = cachedStatus ?? elig;
        reason = cachedReason?.isNotEmpty == true ? cachedReason : null;
      }
      setState(() {
        isSignatureValid = valid;
        errorMsg = null;
        eligibility = elig;
        revocationReason = reason;
        age = parsedAge;
        usedCache = !isOnline || cacheHit;
        cacheStale = stale;
        cacheTimestamp = cachedTs;
      });
    } catch (e) {
      setState(() {
        isSignatureValid = false;
        errorMsg = 'Signature verification error: $e';
        eligibility = 'Unknown';
      });
    }
  }

  Widget cacheStatusBadge() {
    if (!usedCache) return const SizedBox.shrink();
    Color color = cacheStale ? Colors.orange : Colors.blue;
    String text = cacheStale ? 'Offline: Status may be outdated' : 'Offline: Using cached status';
    if (isOnline && cacheStale) text = 'Online: Status may be outdated';
    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Chip(
        label: Text(text, style: const TextStyle(color: Colors.white)),
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    String badgeText;
    if (isSignatureValid == null) {
      badgeColor = Colors.orange;
      badgeText = 'Verifying...';
    } else if (isSignatureValid == true) {
      badgeColor = Colors.green;
      badgeText = 'Signature Verified';
    } else {
      badgeColor = Colors.red;
      badgeText = 'Invalid Signature';
    }

    Color eligColor;
    if (eligibility == 'Eligible') {
      eligColor = Colors.green;
    } else if (eligibility == 'Ineligible') {
      eligColor = Colors.orange;
    } else if (eligibility == 'Revoked') {
      eligColor = Colors.red;
    } else {
      eligColor = Colors.grey;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Credential Preview')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Card(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text('Name: ${widget.name}\nDOB: ${widget.dob}\nSport: ${widget.sport}${age != null ? '\nAge: $age' : ''}'),
                subtitle: Text(errorMsg ?? 'Offline signature and eligibility check below:'),
              ),
              const SizedBox(height: 16),
              Chip(
                label: Text(badgeText, style: const TextStyle(color: Colors.white)),
                backgroundColor: badgeColor,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              const SizedBox(height: 12),
              Chip(
                label: Text('Eligibility: $eligibility', style: const TextStyle(color: Colors.white)),
                backgroundColor: eligColor,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              if (eligibility == 'Revoked' && revocationReason != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text('Revocation Reason: $revocationReason', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                ),
              cacheStatusBadge(),
              if (isOnline && (usedCache || cacheStale))
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh Status'),
                    onPressed: () => verifySignatureAndEligibility(forceRefresh: true),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// Helper function for signature verification
Future<bool> verifyJwtSignature(String jwt, String issuerAddress) async {
  final parts = jwt.split('.');
  if (parts.length != 3) return false;

  final header = parts[0];
  final payload = parts[1];
  final signature = parts[2];

  final message = utf8.encode('$header.$payload');
  final msgHash = keccakUtf8('$header.$payload'); // Ethereum uses keccak256

  // Decode signature (base64url)
  final sigBytes = base64Url.decode(base64Url.normalize(signature));
  if (sigBytes.length != 65) return false;

  // Split signature into r, s, v
  final r = sigBytes.sublist(0, 32);
  final s = sigBytes.sublist(32, 64);
  final v = sigBytes[64];

  // web3dart expects v to be 27 or 28
  final vFixed = v < 27 ? v + 27 : v;

  // Recover public key
  final pubKey = ecRecoverPublicKeyFromSignature(
    msgHash,
    MsgSignature(bytesToInt(r), bytesToInt(s), vFixed),
  );
  final recoveredAddress = EthereumAddress.fromPublicKey(pubKey);

  // Compare to expected issuer address (case-insensitive)
  return recoveredAddress.hexEip55.toLowerCase() == issuerAddress.toLowerCase();
}

// Helper to convert bytes to int
int bytesToInt(List<int> bytes) {
  var result = 0;
  for (final b in bytes) {
    result = (result << 8) + b;
  }
  return result;
} 