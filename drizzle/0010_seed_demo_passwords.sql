-- Sets working passwords for the three demo accounts seeded in
-- 0001_seed_initial_data.sql, so the login flow actually works out of the
-- box. Only salted PBKDF2 hashes are stored here — no plaintext passwords.
-- See internal deployment notes / secrets manager for the actual demo
-- credentials; do not commit plaintext passwords to this repository.
UPDATE `enterprise_users` SET `password_hash` = 'pbkdf2_sha256$100000$05zV__Vt55AukFCmeYl8Y8Bq$3ZWkIltas4yCaEcSZy0V0vppKzGOYXy87IpctTcWs+4=', `password_salt` = '05zV__Vt55AukFCmeYl8Y8Bq', `force_password_reset` = 0, `password_updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'eu_jiarong_buyer';
--> statement-breakpoint
UPDATE `operator_users` SET `password_hash` = 'pbkdf2_sha256$100000$uqs6kDYTsJOCU04S8jY_HeBQ$c5NiDKLkymOzrH9NduclI8EE3mVpL/gFnpS/JtZibWM=', `password_salt` = 'uqs6kDYTsJOCU04S8jY_HeBQ', `force_password_reset` = 0, `password_updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'ou_manager_liu';
--> statement-breakpoint
UPDATE `operator_users` SET `password_hash` = 'pbkdf2_sha256$100000$6TRT1XRCiiS43PPgsh9OnI59$gt897dLQhJujpzcAW6uFuAS2WHbov33sTjZFeGvRgRI=', `password_salt` = '6TRT1XRCiiS43PPgsh9OnI59', `force_password_reset` = 0, `password_updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'ou_director_chen';
