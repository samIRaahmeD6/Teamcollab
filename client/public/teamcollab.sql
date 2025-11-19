-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 19, 2025 at 01:04 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `teamcollab`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `user_id`, `message`, `created_at`) VALUES
(1, 1, 'hi', '2025-11-12 07:51:43'),
(2, 2, 'hello', '2025-11-12 08:01:33'),
(15, 4, 'hi everyone', '2025-11-13 15:22:14'),
(17, 3, 'hi', '2025-11-13 19:51:20'),
(18, 3, 'how are you guys?', '2025-11-13 19:52:08'),
(21, 1, 'hey', '2025-11-17 12:40:12'),
(22, 4, 'hello everyone', '2025-11-17 12:44:16');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` int(11) NOT NULL,
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `description`, `assigned_to`, `status`, `priority`, `created_at`, `updated_at`) VALUES
(1, 'update UI design', NULL, 1, 'completed', 'high', '2025-11-12 17:12:07', '2025-11-17 18:44:37'),
(9, 'Design login page', 'Design login page', 1, 'in_progress', 'medium', '2025-11-12 18:37:50', '2025-11-17 18:40:07'),
(11, 'Design register page', 'Design register page', 2, 'completed', 'low', '2025-11-13 16:28:58', '2025-11-13 21:13:09'),
(13, 'Create database', 'Create database', 1, 'pending', 'medium', '2025-11-13 16:32:20', '2025-11-13 16:32:20'),
(14, 'Update task page', 'Update task page', 2, 'pending', 'high', '2025-11-13 20:49:27', '2025-11-15 20:53:43'),
(16, 'Design new navbar', 'Design new navbar', 2, 'pending', 'low', '2025-11-13 20:53:40', '2025-11-13 21:30:12');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('online','offline') DEFAULT 'offline',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` enum('admin','member') NOT NULL DEFAULT 'member'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `status`, `created_at`, `role`) VALUES
(1, 'Hasibul Rupok', 'hrupok@gmail.com', '1234', 'offline', '2025-11-11 13:08:35', 'member'),
(2, 'Sharmin Rabu', 'srabu@gmail.com', '1234', 'offline', '2025-11-11 13:09:08', 'member'),
(3, 'Mithila Akter', 'makter@gmail.com', '1234', 'offline', '2025-11-12 10:36:41', 'member'),
(4, 'Samira Ahmed', 'admin@gmail.com', 'admin', 'offline', '2025-11-12 10:42:58', 'admin');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_to` (`assigned_to`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
