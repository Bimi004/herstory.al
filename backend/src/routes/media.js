const express = require('express');
const multer = require('multer');
const crypto = require('crypto');

const supabase = require('../config/supabase');

const requireAuth =
    require('../middleware/requireAuth');

const requireStaff =
    require('../middleware/requireStaff');

const router =
    express.Router();

const BUCKET =
    'product-images';


const mimeExtensions = {

    'image/jpeg':
        'jpg',

    'image/png':
        'png',

    'image/webp':
        'webp',

    'image/gif':
        'gif',

    'video/mp4':
        'mp4',

    'video/webm':
        'webm',

    'video/quicktime':
        'mov'
};


const extensionTypes = {

    jpg:
        'image/jpeg',

    jpeg:
        'image/jpeg',

    png:
        'image/png',

    webp:
        'image/webp',

    gif:
        'image/gif',

    mp4:
        'video/mp4',

    webm:
        'video/webm',

    mov:
        'video/quicktime'
};


const upload =
    multer({

        storage:
            multer.memoryStorage(),

        limits: {
            fileSize:
                50 * 1024 * 1024
        },

        fileFilter:
            (
                req,
                file,
                cb
            ) => {

                if (
                    !mimeExtensions[
                        file.mimetype
                    ]
                ) {

                    return cb(
                        new Error(
                            'Formati i skedarit nuk lejohet.'
                        )
                    );
                }

                cb(
                    null,
                    true
                );
            }
    });


function getExtension(
    storagePath
) {

    return String(
        storagePath || ''
    )
        .split('.')
        .pop()
        .toLowerCase();
}


function getMediaType(
    storagePath
) {

    const extension =
        getExtension(
            storagePath
        );


    if (
        [
            'mp4',
            'webm',
            'mov'
        ].includes(
            extension
        )
    ) {

        return 'video';
    }

    return 'image';
}


/*
    ==========================================================
    REAL MEDIA FILE
    ==========================================================

    Browser -> Backend -> Supabase Storage

    Keshtu browser-i nuk ka nevoje te dije
    public/signed URL te Supabase.
*/

router.get(
    '/file/:mediaId',
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                data: media,
                error: mediaError
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .select(
                        'id,storage_path'
                    )
                    .eq(
                        'id',
                        req.params.mediaId
                    )
                    .single();


            if (
                mediaError ||
                !media
            ) {

                return res
                    .status(404)
                    .send(
                        'Media not found'
                    );
            }


            const {
                data: file,
                error: downloadError
            } =
                await supabase
                    .storage
                    .from(BUCKET)
                    .download(
                        media.storage_path
                    );


            if (
                downloadError ||
                !file
            ) {

                console.error(
                    'Storage download error:',
                    media.storage_path,
                    downloadError
                );

                return res
                    .status(404)
                    .send(
                        'Storage file not found'
                    );
            }


            const buffer =
                Buffer.from(
                    await file.arrayBuffer()
                );


            const extension =
                getExtension(
                    media.storage_path
                );


            const contentType =
                extensionTypes[
                    extension
                ] ||
                file.type ||
                'application/octet-stream';


            res.setHeader(
                'Content-Type',
                contentType
            );


            res.setHeader(
                'Cache-Control',
                'public, max-age=3600'
            );


            res.send(
                buffer
            );


        } catch (error) {

            next(error);
        }
    }
);


/*
    ==========================================================
    MEDIA LIST
    ==========================================================
*/

router.get(
    '/product/:productId',

    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .select(`
                        id,
                        product_id,
                        storage_path,
                        alt_text,
                        sort_order,
                        is_primary,
                        created_at
                    `)
                    .eq(
                        'product_id',
                        req.params.productId
                    )
                    .order(
                        'is_primary',
                        {
                            ascending:
                                false
                        }
                    )
                    .order(
                        'sort_order',
                        {
                            ascending:
                                true
                        }
                    )
                    .order(
                        'created_at',
                        {
                            ascending:
                                true
                        }
                    );


            if (error)
                throw error;


            const media =
                (data || [])
                    .map(
                        item => ({
                            ...item,

                            public_url:
                                '/api/media/file/' +
                                item.id,

                            media_type:
                                getMediaType(
                                    item.storage_path
                                )
                        })
                    );


            res.json({
                success: true,
                media
            });


        } catch (error) {

            next(error);
        }
    }
);


/*
    ==========================================================
    UPLOAD
    ==========================================================
*/

router.post(
    '/product/:productId',

    requireAuth,
    requireStaff,

    upload.single(
        'file'
    ),

    async (
        req,
        res,
        next
    ) => {

        let storagePath =
            null;


        try {

            if (!req.file) {

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            'Nuk u dërgua asnjë skedar.'
                    });
            }


            const productId =
                req.params.productId;


            const {
                data: product,
                error: productError
            } =
                await supabase
                    .from('products')
                    .select('id,name')
                    .eq(
                        'id',
                        productId
                    )
                    .single();


            if (
                productError ||
                !product
            ) {

                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            'Produkti nuk u gjet.'
                    });
            }


            const extension =
                mimeExtensions[
                    req.file.mimetype
                ];


            const filename =
                Date.now() +
                '-' +
                crypto.randomUUID() +
                '.' +
                extension;


            storagePath =
                productId +
                '/' +
                filename;


            const {
                error: uploadError
            } =
                await supabase
                    .storage
                    .from(BUCKET)
                    .upload(
                        storagePath,
                        req.file.buffer,
                        {
                            contentType:
                                req.file.mimetype,

                            cacheControl:
                                '3600',

                            upsert:
                                false
                        }
                    );


            if (uploadError)
                throw uploadError;


            const {
                data: existing,
                error: existingError
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .select('id')
                    .eq(
                        'product_id',
                        productId
                    )
                    .limit(1);


            if (existingError)
                throw existingError;


            const firstMedia =
                !existing ||
                existing.length === 0;


            const {
                data: media,
                error: insertError
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .insert({
                        product_id:
                            productId,

                        storage_path:
                            storagePath,

                        alt_text:
                            req.body.alt_text ||
                            product.name,

                        sort_order:
                            Number(
                                req.body.sort_order
                            ) || 0,

                        is_primary:
                            firstMedia
                    })
                    .select()
                    .single();


            if (insertError)
                throw insertError;


            res
                .status(201)
                .json({

                    success:
                        true,

                    message:
                        'Media u ngarkua me sukses.',

                    media: {
                        ...media,

                        public_url:
                            '/api/media/file/' +
                            media.id,

                        media_type:
                            getMediaType(
                                storagePath
                            ),

                        mime_type:
                            req.file.mimetype,

                        size:
                            req.file.size
                    }
                });


        } catch (error) {

            if (storagePath) {

                await supabase
                    .storage
                    .from(BUCKET)
                    .remove([
                        storagePath
                    ]);
            }

            next(error);
        }
    }
);


/*
    ==========================================================
    PRIMARY
    ==========================================================
*/

router.patch(
    '/:mediaId/primary',

    requireAuth,
    requireStaff,

    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                data: media,
                error
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .select(
                        'id,product_id'
                    )
                    .eq(
                        'id',
                        req.params.mediaId
                    )
                    .single();


            if (
                error ||
                !media
            ) {

                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            'Media nuk u gjet.'
                    });
            }


            const {
                error: resetError
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .update({
                        is_primary:
                            false
                    })
                    .eq(
                        'product_id',
                        media.product_id
                    );


            if (resetError)
                throw resetError;


            const {
                data: updated,
                error: updateError
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .update({
                        is_primary:
                            true
                    })
                    .eq(
                        'id',
                        media.id
                    )
                    .select()
                    .single();


            if (updateError)
                throw updateError;


            res.json({
                success:
                    true,

                message:
                    'Media kryesore u ndryshua.',

                media:
                    updated
            });


        } catch (error) {

            next(error);
        }
    }
);


/*
    ==========================================================
    DELETE
    ==========================================================
*/

router.delete(
    '/:mediaId',

    requireAuth,
    requireStaff,

    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                data: media,
                error
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .select(`
                        id,
                        product_id,
                        storage_path,
                        is_primary
                    `)
                    .eq(
                        'id',
                        req.params.mediaId
                    )
                    .single();


            if (
                error ||
                !media
            ) {

                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            'Media nuk u gjet.'
                    });
            }


            const {
                error: storageError
            } =
                await supabase
                    .storage
                    .from(BUCKET)
                    .remove([
                        media.storage_path
                    ]);


            if (storageError)
                throw storageError;


            const {
                error: deleteError
            } =
                await supabase
                    .from(
                        'product_images'
                    )
                    .delete()
                    .eq(
                        'id',
                        media.id
                    );


            if (deleteError)
                throw deleteError;


            if (
                media.is_primary
            ) {

                const {
                    data: nextMedia
                } =
                    await supabase
                        .from(
                            'product_images'
                        )
                        .select('id')
                        .eq(
                            'product_id',
                            media.product_id
                        )
                        .order(
                            'sort_order',
                            {
                                ascending:
                                    true
                            }
                        )
                        .limit(1)
                        .maybeSingle();


                if (nextMedia) {

                    await supabase
                        .from(
                            'product_images'
                        )
                        .update({
                            is_primary:
                                true
                        })
                        .eq(
                            'id',
                            nextMedia.id
                        );
                }
            }


            res.json({
                success:
                    true,

                message:
                    'Media u fshi me sukses.'
            });


        } catch (error) {

            next(error);
        }
    }
);


module.exports = router;