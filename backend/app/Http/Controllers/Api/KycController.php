<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantKycDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KycController extends Controller
{
    public function status(Request $request)
    {
        $tenant = $request->user()->tenant;

        $documents = $tenant->kycDocuments()->get()->keyBy('document_type');

        return response()->json([
            'kyc_status' => $tenant->kyc_status,
            'kyc_approved_at' => $tenant->kyc_approved_at,
            'can_withdraw' => $tenant->canRequestWithdrawal(),
            'documents' => [
                'identity' => $documents->get('identity'),
                'address_proof' => $documents->get('address_proof'),
            ],
            'required' => ['identity', 'address_proof'],
        ]);
    }

    public function upload(Request $request)
    {
        $validated = $request->validate([
            'document_type' => 'required|in:identity,address_proof',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $tenant = $request->user()->tenant;
        $file = $request->file('file');

        $existing = $tenant->kycDocuments()
            ->where('document_type', $validated['document_type'])
            ->first();

        if ($existing && $existing->status === 'approved') {
            return response()->json([
                'message' => 'Ce document a déjà été validé',
            ], 400);
        }

        $path = $file->store(
            "kyc/{$tenant->id}",
            config('filesystems.kyc_disk', 'local')
        );

        if ($existing) {
            Storage::disk(config('filesystems.kyc_disk', 'local'))
                ->delete($existing->file_path);

            $existing->update([
                'file_path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'status' => 'pending',
                'reviewed_by' => null,
                'reviewed_at' => null,
                'rejection_reason' => null,
            ]);

            $document = $existing;
        } else {
            $document = TenantKycDocument::create([
                'tenant_id' => $tenant->id,
                'document_type' => $validated['document_type'],
                'file_path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'status' => 'pending',
            ]);
        }

        if ($tenant->kyc_status !== 'approved') {
            $tenant->update(['kyc_status' => 'pending']);
        }

        return response()->json([
            'message' => 'Document uploadé avec succès',
            'document' => $document,
        ], 201);
    }

    public function download(Request $request, TenantKycDocument $document)
    {
        $tenant = $request->user()->tenant;

        if ($document->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $disk = config('filesystems.kyc_disk', 'local');

        if (!Storage::disk($disk)->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier non trouvé'], 404);
        }

        return Storage::disk($disk)->download(
            $document->file_path,
            $document->original_filename
        );
    }
}
