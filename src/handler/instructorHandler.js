const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getPrisma } = require("../utils/prisma");
const { instructorMiddleware } = require("../middleware/authMiddleware");
const { logger } = require("../utils/logger");

router.post('/update-profile',instructorMiddleware,async(req,res)=>{
    const {bio,expertise,linkedin} = req.body
    const prisma = getPrisma();
    
    try{
        if(!bio || !expertise || !linkedin){
            return res.status(400).json({msg:'Need to fulfill all fields'})
        }

        const instructorProfile = await prisma.instructorProfile.upsert({
            where: { userId: req.userId },
            update: {
                bio,
                expertise,
                linkedin
            },
            create: {
                userId: req.userId,
                bio,
                expertise,
                linkedin
            }
        });

        return res.status(200).json({
            msg: 'Profile updated successfully',
            profile: instructorProfile
        });

    }catch(err){
        console.log(err);
        return res.status(500).json({error: 'Failed to update profile'});
    }
})

router.post('/add-course',instructorMiddleware,async(req,res)=>{
    const prisma = getPrisma();
    const {title,description,price,level} = req.body;
    
    try{
        if(!title||!description||!price||!level){
           return res.status(400).json({msg:'Need to fill all fields'})
        }

        const instructorProfile = await prisma.instructorProfile.findUnique({
            where: { userId: req.userId }
        });

        if (!instructorProfile) {
            return res.status(404).json({msg: 'Instructor profile not found'});
        }

        const course = await prisma.course.create({
            data:{
                title,
                description,
                price: parseFloat(price),
                level,
                instructorProfileId: instructorProfile.id,
            },
            select:{
                id:true,
                title:true,
                description:true,
                price:true,
                level:true,
                instructorProfileId:true,
            },
        });

        logger.info(`Course created: ${course.id} by instructor ${req.userId}`);
        return res.status(201).json({course, msg:'Course created successfully'});

    }catch(err){
        logger.error('Add course error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})

router.get('/my-courses', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    
    try{
        const instructorProfile = await prisma.instructorProfile.findUnique({
            where: { userId: req.userId },
            include: { courses: true }
        });

        if (!instructorProfile) {
            return res.status(404).json({msg: 'Instructor profile not found'});
        }

        logger.info(`Fetched courses for instructor ${req.userId}`);
        return res.status(200).json({
            courses: instructorProfile.courses,
            total: instructorProfile.courses.length
        });

    }catch(err){
        logger.error('Fetch courses error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})

router.get('/course/:courseId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId} = req.params;
    
    try{
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { instructorProfile: true }
        });

        if (!course) {
            return res.status(404).json({msg: 'Course not found'});
        }

        if (course.instructorProfile.userId !== req.userId) {
            return res.status(403).json({msg: 'Access denied. You can only view your own courses'});
        }

        return res.status(200).json({course});

    }catch(err){
        return res.status(500).json({error: 'Internal server error'});
    }
})

router.put('/course/:courseId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId} = req.params;
    const {title, description, price, level} = req.body;
    
    try{
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { instructorProfile: true }
        });

        if (!course) {
            return res.status(404).json({msg: 'Course not found'});
        }

        if (course.instructorProfile.userId !== req.userId) {
            return res.status(403).json({msg: 'Access denied. You can only update your own courses'});
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (price) updateData.price = parseFloat(price);
        if (level) updateData.level = level;

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: updateData
        });

        return res.status(200).json({
            course: updatedCourse,
            msg: 'Course updated successfully'
        });

    }catch(err){
        logger.error('Update course error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})

router.delete('/course/:courseId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId} = req.params;
    
    try{
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { instructorProfile: true }
        });

        if (!course) {
            return res.status(404).json({msg: 'Course not found'});
        }

        if (course.instructorProfile.userId !== req.userId) {
            return res.status(403).json({msg: 'Access denied. You can only delete your own courses'});
        }

        await prisma.course.delete({
            where: { id: courseId }
        });

        return res.status(200).json({msg: 'Course deleted successfully'});

    }catch(err){
        return res.status(500).json({error: 'Internal server error'});
    }
})












module.exports = router;
