-- PayTrack Migration: Subscriptions, Wallets, Orders, Stock
-- Date: 2026-08-07
-- Run this in phpMyAdmin on u166382491_paytrack
-- COMPATIBLE with existing schema

SET FOREIGN_KEY_CHECKS=0;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTIE 1: ALTER TABLES EXISTANTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Ajouter colonnes sur tenants
ALTER TABLE `tenants`
    ADD COLUMN `logo_path` VARCHAR(255) NULL AFTER `phone`,
    ADD COLUMN `wave_number` VARCHAR(255) NULL AFTER `logo_path`,
    ADD COLUMN `orange_money_number` VARCHAR(255) NULL AFTER `wave_number`,
    ADD COLUMN `settings` JSON NULL AFTER `currency`;

-- Ajouter colonnes sur articles
ALTER TABLE `articles`
    ADD COLUMN `stock_reserved` INT UNSIGNED DEFAULT 0 AFTER `stock`,
    ADD COLUMN `stock_alert_threshold` INT UNSIGNED DEFAULT 5 AFTER `stock_reserved`,
    ADD COLUMN `track_stock` TINYINT(1) DEFAULT 1 AFTER `stock_alert_threshold`;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTIE 2: NOUVELLES TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Plans d'abonnement
CREATE TABLE `subscription_plans` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `price_monthly` BIGINT UNSIGNED NOT NULL,
    `price_yearly` BIGINT UNSIGNED NOT NULL,
    `max_products` INT UNSIGNED NULL,
    `max_users` INT UNSIGNED NOT NULL,
    `multi_shop` TINYINT(1) DEFAULT 0,
    `supplier_orders` TINYINT(1) DEFAULT 0,
    `advanced_stock` TINYINT(1) DEFAULT 0,
    `features` JSON NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Abonnements par tenant
CREATE TABLE `subscriptions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `plan_id` BIGINT UNSIGNED NOT NULL,
    `billing_cycle` ENUM('monthly', 'yearly') DEFAULT 'monthly',
    `status` ENUM('trial', 'active', 'expired', 'suspended', 'cancelled') DEFAULT 'trial',
    `trial_ends_at` TIMESTAMP NULL,
    `current_period_start` TIMESTAMP NULL,
    `current_period_end` TIMESTAMP NULL,
    `cancelled_at` TIMESTAMP NULL,
    `suspended_at` TIMESTAMP NULL,
    `assisted_setup_requested` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `subscriptions_tenant_status_idx` (`tenant_id`, `status`),
    CONSTRAINT `subscriptions_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `subscriptions_plan_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Factures d'abonnement
CREATE TABLE `subscription_invoices` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `subscription_id` BIGINT UNSIGNED NOT NULL,
    `invoice_number` VARCHAR(255) NOT NULL UNIQUE,
    `amount` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    `paytech_ref` VARCHAR(255) NULL,
    `due_date` TIMESTAMP NOT NULL,
    `paid_at` TIMESTAMP NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `subscription_invoices_tenant_status_idx` (`tenant_id`, `status`),
    CONSTRAINT `sub_invoices_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `sub_invoices_sub_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portefeuilles marchands
CREATE TABLE `wallets` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `balance` BIGINT UNSIGNED DEFAULT 0,
    `pending_balance` BIGINT UNSIGNED DEFAULT 0,
    `total_credits` BIGINT UNSIGNED DEFAULT 0,
    `total_debits` BIGINT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `wallets_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions portefeuille
CREATE TABLE `wallet_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `wallet_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('credit', 'debit') NOT NULL,
    `amount` BIGINT UNSIGNED NOT NULL,
    `balance_after` BIGINT UNSIGNED NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `reference` VARCHAR(255) NULL,
    `paytech_transaction_id` VARCHAR(255) NULL UNIQUE,
    `transactionable_type` VARCHAR(255) NULL,
    `transactionable_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `wallet_txn_tenant_type_idx` (`tenant_id`, `type`),
    INDEX `wallet_txn_morph_idx` (`transactionable_type`, `transactionable_id`),
    CONSTRAINT `wallet_txn_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `wallet_txn_wallet_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demandes de retrait
CREATE TABLE `withdrawal_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `wallet_id` BIGINT UNSIGNED NOT NULL,
    `requested_by` BIGINT UNSIGNED NOT NULL,
    `amount` BIGINT UNSIGNED NOT NULL,
    `payout_method` ENUM('wave', 'orange_money', 'bank_transfer') NOT NULL,
    `payout_account` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
    `processed_by` BIGINT UNSIGNED NULL,
    `processed_at` TIMESTAMP NULL,
    `admin_notes` TEXT NULL,
    `payout_reference` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `withdrawal_tenant_status_idx` (`tenant_id`, `status`),
    CONSTRAINT `withdrawal_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `withdrawal_wallet_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE CASCADE,
    CONSTRAINT `withdrawal_user_fk` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `withdrawal_admin_fk` FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs webhooks PayTech
CREATE TABLE `paytech_webhooks` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `paytech_transaction_id` VARCHAR(255) NOT NULL,
    `event_type` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `signature_received` VARCHAR(255) NULL,
    `signature_valid` TINYINT(1) DEFAULT 0,
    `ip_address` VARCHAR(45) NULL,
    `processing_status` ENUM('received', 'processed', 'ignored', 'failed') DEFAULT 'received',
    `processing_notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `paytech_txn_idx` (`paytech_transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fournisseurs
CREATE TABLE `suppliers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contact_name` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    INDEX `suppliers_tenant_idx` (`tenant_id`),
    CONSTRAINT `suppliers_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commandes fournisseurs
CREATE TABLE `supplier_orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `shop_id` BIGINT UNSIGNED NULL,
    `supplier_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `reference` VARCHAR(255) NOT NULL UNIQUE,
    `total_amount` BIGINT UNSIGNED DEFAULT 0,
    `paid_amount` BIGINT UNSIGNED DEFAULT 0,
    `remaining_amount` BIGINT UNSIGNED DEFAULT 0,
    `status` ENUM('draft', 'sent', 'partial_received', 'received', 'cancelled') DEFAULT 'draft',
    `order_date` DATE NOT NULL,
    `expected_date` DATE NULL,
    `received_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    INDEX `sup_orders_tenant_status_idx` (`tenant_id`, `status`),
    CONSTRAINT `sup_orders_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `sup_orders_shop_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL,
    CONSTRAINT `sup_orders_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `sup_orders_user_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lignes commandes fournisseurs
CREATE TABLE `supplier_order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `supplier_order_id` BIGINT UNSIGNED NOT NULL,
    `article_id` BIGINT UNSIGNED NULL,
    `article_name` VARCHAR(255) NOT NULL,
    `quantity_ordered` INT UNSIGNED NOT NULL,
    `quantity_received` INT UNSIGNED DEFAULT 0,
    `unit_price` BIGINT UNSIGNED NOT NULL,
    `total_price` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `sup_items_order_fk` FOREIGN KEY (`supplier_order_id`) REFERENCES `supplier_orders`(`id`) ON DELETE CASCADE,
    CONSTRAINT `sup_items_article_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paiements fournisseurs
CREATE TABLE `supplier_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `supplier_order_id` BIGINT UNSIGNED NOT NULL,
    `recorded_by` BIGINT UNSIGNED NOT NULL,
    `reference` VARCHAR(255) NOT NULL UNIQUE,
    `amount` BIGINT UNSIGNED NOT NULL,
    `payment_date` DATE NOT NULL,
    `payment_method` ENUM('especes', 'wave', 'orange_money', 'virement', 'cheque') NOT NULL,
    `proof_path` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `sup_payments_tenant_idx` (`tenant_id`),
    CONSTRAINT `sup_payments_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `sup_payments_order_fk` FOREIGN KEY (`supplier_order_id`) REFERENCES `supplier_orders`(`id`) ON DELETE CASCADE,
    CONSTRAINT `sup_payments_user_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commandes clients
CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `shop_id` BIGINT UNSIGNED NULL,
    `client_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `reference` VARCHAR(255) NOT NULL UNIQUE,
    `qr_uuid` CHAR(36) NOT NULL UNIQUE,
    `subtotal` BIGINT UNSIGNED DEFAULT 0,
    `discount` BIGINT UNSIGNED DEFAULT 0,
    `total_amount` BIGINT UNSIGNED NOT NULL,
    `paid_amount` BIGINT UNSIGNED DEFAULT 0,
    `remaining_amount` BIGINT UNSIGNED NOT NULL,
    `payment_mode` ENUM('comptant', 'tranche') DEFAULT 'comptant',
    `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    `payment_status` ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    `order_date` DATE NOT NULL,
    `delivery_date` DATE NULL,
    `notes` TEXT NULL,
    `paytech_payment_ref` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    INDEX `orders_tenant_status_idx` (`tenant_id`, `status`),
    INDEX `orders_tenant_payment_idx` (`tenant_id`, `payment_status`),
    CONSTRAINT `orders_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `orders_shop_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL,
    CONSTRAINT `orders_client_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `orders_user_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lignes commandes clients
CREATE TABLE `order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `article_id` BIGINT UNSIGNED NULL,
    `article_name` VARCHAR(255) NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `unit_price` BIGINT UNSIGNED NOT NULL,
    `discount` BIGINT UNSIGNED DEFAULT 0,
    `total_price` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `order_items_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    CONSTRAINT `order_items_article_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paiements commandes clients
CREATE TABLE `order_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `recorded_by` BIGINT UNSIGNED NULL,
    `receipt_number` VARCHAR(255) NOT NULL UNIQUE,
    `amount` BIGINT UNSIGNED NOT NULL,
    `payment_date` DATE NOT NULL,
    `payment_method` ENUM('especes', 'wave', 'orange_money', 'free_money', 'card', 'wizall', 'emoney') NOT NULL,
    `paytech_transaction_id` VARCHAR(255) NULL UNIQUE,
    `source` ENUM('manual', 'paytech') DEFAULT 'manual',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `order_payments_tenant_order_idx` (`tenant_id`, `order_id`),
    CONSTRAINT `order_payments_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `order_payments_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    CONSTRAINT `order_payments_user_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mouvements de stock
CREATE TABLE `stock_movements` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `article_id` BIGINT UNSIGNED NOT NULL,
    `shop_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `type` ENUM('in', 'out', 'adjustment', 'reservation', 'release') NOT NULL,
    `quantity` INT NOT NULL,
    `stock_before` INT UNSIGNED NOT NULL,
    `stock_after` INT UNSIGNED NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `moveable_type` VARCHAR(255) NULL,
    `moveable_id` BIGINT UNSIGNED NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `stock_mv_tenant_article_idx` (`tenant_id`, `article_id`),
    INDEX `stock_mv_tenant_type_idx` (`tenant_id`, `type`),
    INDEX `stock_mv_morph_idx` (`moveable_type`, `moveable_id`),
    CONSTRAINT `stock_mv_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `stock_mv_article_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
    CONSTRAINT `stock_mv_shop_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL,
    CONSTRAINT `stock_mv_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventaires
CREATE TABLE `inventories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `shop_id` BIGINT UNSIGNED NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `reference` VARCHAR(255) NOT NULL UNIQUE,
    `inventory_date` DATE NOT NULL,
    `status` ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `inventories_tenant_idx` (`tenant_id`),
    CONSTRAINT `inventories_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
    CONSTRAINT `inventories_shop_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL,
    CONSTRAINT `inventories_user_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lignes inventaire
CREATE TABLE `inventory_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `inventory_id` BIGINT UNSIGNED NOT NULL,
    `article_id` BIGINT UNSIGNED NOT NULL,
    `expected_quantity` INT UNSIGNED NOT NULL,
    `counted_quantity` INT UNSIGNED NOT NULL,
    `difference` INT NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `inv_items_inv_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON DELETE CASCADE,
    CONSTRAINT `inv_items_article_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTIE 3: SEED DES PLANS D'ABONNEMENT
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO `subscription_plans` (`name`, `slug`, `price_monthly`, `price_yearly`, `max_products`, `max_users`, `multi_shop`, `supplier_orders`, `advanced_stock`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
('Essentiel', 'essentiel', 3000, 30000, 50, 1, 0, 0, 0, '{"clients":true,"orders":true,"payments":true,"receipts":true,"basic_stock":true,"qr_codes":true}', 1, NOW(), NOW()),
('Pro', 'pro', 7500, 75000, 500, 3, 0, 0, 1, '{"clients":true,"orders":true,"payments":true,"receipts":true,"basic_stock":true,"advanced_stock":true,"inventory":true,"deliveries":true,"customer_debts":true,"qr_codes":true,"exports":true}', 1, NOW(), NOW()),
('Business', 'business', 13000, 130000, NULL, 5, 1, 1, 1, '{"clients":true,"orders":true,"payments":true,"receipts":true,"basic_stock":true,"advanced_stock":true,"inventory":true,"deliveries":true,"customer_debts":true,"supplier_orders":true,"supplier_payments":true,"supplier_debts":true,"multi_shop":true,"advanced_reports":true,"qr_codes":true,"exports":true}', 1, NOW(), NOW());

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTIE 4: ENREGISTRER LA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO `migrations` (`migration`, `batch`) VALUES
('2026_08_07_000001_add_subscriptions_wallets_orders', 3);

SELECT 'Migration completed successfully!' AS status;
