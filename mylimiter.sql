DROP TABLE IF EXISTS `drips`;
CREATE TABLE `drips` (
    id int(11) NOT NULL AUTO_INCREMENT,
    ts timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bucket varchar(64) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `ts` (`ts`),
    KEY `bucket_ts` (`bucket`, `ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DELIMITER ;;
DROP PROCEDURE IF EXISTS `drip`;;
CREATE PROCEDURE `drip`(IN buck varchar(64), IN size INT, IN period INT)
BEGIN
    DECLARE count INT;

    DELETE FROM drips WHERE bucket = buck AND ts < NOW() - INTERVAL period SECOND;

    SELECT COUNT(*) INTO count FROM drips WHERE bucket = buck;

    IF (count < size) THEN
        INSERT INTO drips (bucket) VALUES (buck);
    ELSE
        SIGNAL SQLSTATE '45429' SET MESSAGE_TEXT='Bucket is Full';
    END IF;
END ;;

