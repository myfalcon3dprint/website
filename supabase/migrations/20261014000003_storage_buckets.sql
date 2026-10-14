-- Falcon 3D Prints — Storage Buckets & Policies
-- Migration: 20261014000003_storage_buckets.sql
-- Sets up 'cad-models' and 'product-images' storage buckets in Supabase Storage.

-- 1. Create 'cad-models' private bucket for custom quotation uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cad-models',
    'cad-models',
    false,
    52428800, -- 50 MB limit
    ARRAY[
        'application/octet-stream',
        'application/sla',
        'model/stl',
        'model/obj',
        'application/vnd.ms-pki.stl',
        'application/step',
        'application/x-step',
        'model/step',
        'model/3mf',
        'application/zip'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800;

-- 2. Create 'product-images' public bucket for studio product photographs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/svg+xml'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;

-- Storage Policies for 'cad-models' (Private bucket)
-- Anyone can upload custom CAD/STL models for a quote
CREATE POLICY "Allow public upload to cad-models"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'cad-models');

-- Staff or uploader can access objects in cad-models via signed URLs
CREATE POLICY "Allow staff to read cad-models"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'cad-models' AND (public.is_staff() OR auth.uid() = owner));

-- Staff can delete from cad-models
CREATE POLICY "Allow staff to delete from cad-models"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'cad-models' AND public.is_staff());

-- Storage Policies for 'product-images' (Public bucket)
-- Anyone can view product images
CREATE POLICY "Public read product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

-- Only staff can upload or modify product images
CREATE POLICY "Staff manage product-images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'product-images' AND public.is_staff());
