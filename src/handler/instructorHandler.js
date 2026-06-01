const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getPrisma } = require("../utils/prisma");
const { instructorMiddleware } = require("../middleware/authMiddleware");
const { logger } = require("../utils/logger");

/**
 * @swagger
 * /ins/update-profile:
 *   post:
 *     summary: Update instructor profile (instructor only)
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 description: Instructor biography
 *               expertise:
 *                 type: string
 *                 description: Areas of expertise
 *               linkedin:
 *                 type: string
 *                 description: LinkedIn profile URL
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/update-profile',instructorMiddleware,async(req,res)=>{
    const {bio,skills} = req.body
    const prisma = getPrisma();
    
    try{

        if (!prisma) {
            return res.status(500).json({error: 'Database connection failed'});
        }

        if(!bio || !expertise || !linkedin){

  
            return res.status(400).json({msg:'Need to fulfill all fields'})
        }

        const instructorProfile = await prisma.instructorProfile.upsert({
            where: { userId: req.userId },
            update: {
                bio,
                skills
            },
            create: {
                userId: req.userId,
                bio,
                skills
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

/**
 * @swagger
 * /ins/add-course:
 *   post:
 *     summary: Add a new course (instructor only)
 *     tags: [Instructor - Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Course title
 *               description:
 *                 type: string
 *                 description: Course description
 *               price:
 *                 type: number
 *                 description: Course price
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: Course difficulty level
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Instructor profile not found
 *       500:
 *         description: Internal server error
 */
router.post('/add-course',instructorMiddleware,async(req,res)=>{
    const prisma = getPrisma();
    const {title,description,price} = req.body;
    
    try{

        if (!prisma) {
            return res.status(500).json({error: 'Database connection failed'});
        }

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
                instructorProfileId: instructorProfile.id,
            },
            select:{
                id:true,
                title:true,
                description:true,
                price:true,
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

/**
 * @swagger
 * /ins/my-courses:
 *   get:
 *     summary: Get all courses created by instructor (instructor only)
 *     tags: [Instructor - Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 *       404:
 *         description: Instructor profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/my-courses', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    
    try{
        if (!prisma) {
            return res.status(500).json({error: 'Database connection failed'});
        }

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

/**
 * @swagger
 * /ins/course/{courseId}:
 *   get:
 *     summary: Get course details (instructor only)
 *     tags: [Instructor - Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update course (instructor only)
 *     tags: [Instructor - Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               level:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete course (instructor only)
 *     tags: [Instructor - Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/course/:courseId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId} = req.params;
    
    try{
        if (!prisma) {
            return res.status(500).json({error: 'Database connection failed'});
        }

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
    const {title, description, price} = req.body;
    
    try{
        if (!prisma) {
            return res.status(500).json({error: 'Database connection failed'});
        }

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
        if (!prisma) {
            return res.status(500).json({error: 'Database connection failed'});
        }

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


//section management

router.post('/course/:courseId/section',instructorMiddleware,async(req,res)=>{
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
        const{title,order} = req.body;
        const courseSection = await prisma.courseSection.create({
            data:{
                courseId,
                title,
                order,

            },
            select:{
                id : true,
                courseId: true,
                title:true,
                order: true,
                createdAt: true,
                
            },
        })
        return res.status(201).json({course, msg:'Course section created successfully'});

    }catch(err){
        console.log(err);
        res.status(500).json({msg:'internal server error'})
    }  

})


router.get('/course/:courseId/section',instructorMiddleware,async(req,res)=>{
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
        const result = await prisma.courseSection.findUnique({
            where:{id:courseId},
            include:{
                course:true,
                lessons: true,
            }
        })
        return res.status(200).json({allSection: result,
            msg:"section fetch successfull"
        })
    }catch(err){
        console.log(er);
        return res.status(500).json({msg: 'internal server error'});


    }

})

router.put('/course/:courseId/section/:sectionId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId, sectionId} = req.params;
    const {title, order} = req.body;
    
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
        if (order) updateData.order = order;

        const updatedSection = await prisma.courseSection.update({
            where: { id: sectionId },
            data: updateData
        });

        return res.status(200).json({
            section: updatedSection,
            msg: 'Section updated successfully'
        });

    }catch(err){
        logger.error('Update section error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})

router.delete('/course/:courseId/section/:sectionId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId, sectionId} = req.params;
    
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

        await prisma.courseSection.delete({
            where: { id: sectionId }
        });

        return res.status(200).json({msg: 'Section deleted successfully'});

    }catch(err){
        logger.error('Delete section error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})



//lesson management
router.post('/lesson/:courseId/section/:sectionId',instructorMiddleware,async(req,res)=>{
    const prisma = getPrisma();
    const {courseId, sectionId} = req.params;
    const {title, videoUrl, order} = req.body;
    
    try{
        if(!title || !videoUrl || !order) {
            return res.status(400).json({msg: 'Need to fill all fields'});
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { instructorProfile: true }
        });

        if (!course) {
            return res.status(404).json({msg: 'Course not found'});
        }

        if (course.instructorProfile.userId !== req.userId) {
            return res.status(403).json({msg: 'Access denied. You can only add lesson on your own courses'});
        }

        const lesson = await prisma.lesson.create({
            data:{
                title,
                videoUrl,
                order,
                courseId,
                courseSectionId: sectionId
            },
            select:{
                id : true,
                courseId: true,
                courseSectionId: true,
                title: true,
                videoUrl: true,
                order: true,
                createdAt: true
            },
        });
        return res.status(201).json({lesson: lesson, msg:'Lesson added successfully'});

    }catch(err){
        logger.error('Add lesson error:', err.message);
        return res.status(500).json({msg:'Internal server error'});
    }
})

router.get('/lesson/:courseId/section/:sectionId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {courseId, sectionId} = req.params;
    
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

        const lessons = await prisma.lesson.findMany({
            where: { courseSectionId: sectionId }
        });

        return res.status(200).json({lessons: lessons, total: lessons.length});

    }catch(err){
        logger.error('Fetch lessons error:', err.message);
        return res.status(500).json({msg:'Internal server error'});
    }
})

router.put('/lesson/:lessonId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {lessonId} = req.params;
    const {title, videoUrl, order} = req.body;
    
    try{
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { include: { instructorProfile: true } } }
        });

        if (!lesson) {
            return res.status(404).json({msg: 'Lesson not found'});
        }

        if (lesson.course.instructorProfile.userId !== req.userId) {
            return res.status(403).json({msg: 'Access denied. You can only update your own lessons'});
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (videoUrl) updateData.videoUrl = videoUrl;
        if (order) updateData.order = order;

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData
        });

        return res.status(200).json({
            lesson: updatedLesson,
            msg: 'Lesson updated successfully'
        });

    }catch(err){
        logger.error('Update lesson error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})

router.delete('/lesson/:lessonId', instructorMiddleware, async(req,res)=>{
    const prisma = getPrisma();
    const {lessonId} = req.params;
    
    try{
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { include: { instructorProfile: true } } }
        });

        if (!lesson) {
            return res.status(404).json({msg: 'Lesson not found'});
        }

        if (lesson.course.instructorProfile.userId !== req.userId) {
            return res.status(403).json({msg: 'Access denied. You can only delete your own lessons'});
        }

        await prisma.lesson.delete({
            where: { id: lessonId }
        });

        return res.status(200).json({msg: 'Lesson deleted successfully'});

    }catch(err){
        logger.error('Delete lesson error:', err.message);
        return res.status(500).json({error: 'Internal server error'});
    }
})






module.exports = router;
