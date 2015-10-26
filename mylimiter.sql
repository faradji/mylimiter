DROP TABLE IF EXISTS `drips`;
CREATE TABLE `drips` (
    id int(11) NOT NULL AUTO_INCREMENT,
    ts timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bucket varchar(64) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `bucket` (`bucket`),
    KEY `bucket_ts` (`bucket`, `ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DELIMITER ;;
DROP PROCEDURE IF EXISTS `drip`;;
CREATE PROCEDURE `drip`(buck varchar(64), size INT, period INT)
BEGIN
    DECLARE count INT;

    DELETE FROM drips WHERE bucket = buck AND ts < NOW() - INTERVAL period SECOND;

    START TRANSACTION;
    SELECT COUNT(*) INTO count FROM drips WHERE bucket = buck FOR UPDATE;
    IF (count >= size) THEN
        SIGNAL SQLSTATE '45429' SET MESSAGE_TEXT='Bucket is Full';
    END IF;

    INSERT INTO drips (bucket) VALUES (buck);
    COMMIT;
END ;;

DELIMITER ;
