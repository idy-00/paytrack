<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $articles = Article::query()
            ->when($request->search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%")
                      ->orWhere('reference', 'like', "%{$search}%");
                });
            })
            ->when($request->has('active_only'), fn($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->paginate(100);

        return response()->json($articles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'category'    => ['nullable', 'string', 'max:100'],
            'reference'   => ['nullable', 'string', 'max:100'],
            'price'       => ['required', 'integer', 'min:0'],
            'stock'       => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $article = Article::create($validated);

        AuditLog::create([
            'tenant_id'      => $article->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'article.created',
            'auditable_type' => Article::class,
            'auditable_id'   => $article->id,
            'new_values'     => ['name' => $article->name, 'price' => $article->price],
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($article, 201);
    }

    public function show(Article $article): JsonResponse
    {
        return response()->json($article);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['sometimes', 'required', 'string', 'max:255'],
            'category'    => ['nullable', 'string', 'max:100'],
            'reference'   => ['nullable', 'string', 'max:100'],
            'price'       => ['sometimes', 'required', 'integer', 'min:0'],
            'stock'       => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $oldValues = $article->only(array_keys($validated));
        $article->update($validated);

        AuditLog::create([
            'tenant_id'      => $article->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'article.updated',
            'auditable_type' => Article::class,
            'auditable_id'   => $article->id,
            'old_values'     => $oldValues,
            'new_values'     => $validated,
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($article);
    }

    public function destroy(Article $article): JsonResponse
    {
        $article->update(['is_active' => false]);
        return response()->json(['message' => 'Article désactivé.']);
    }
}
