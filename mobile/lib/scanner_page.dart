import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class ScannerPage extends StatelessWidget {
  const ScannerPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Athlete ID')),
      body: MobileScanner(
        onDetect: (capture) {
          final List<Barcode> barcodes = capture.barcodes;
          if (barcodes.isNotEmpty) {
            final String? did = barcodes.first.rawValue;
            if (did != null && did.isNotEmpty) {
              // Pop the scanner page and return the scanned DID
              Navigator.of(context).pop(did);
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